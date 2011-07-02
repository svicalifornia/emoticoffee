(function() {
  var Instruction, Interpreter, Parser;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Instruction = (function() {
    function Instruction(value, type) {
      var emoticon;
      this.value = value;
      this.type = type;
      if (this.type === 'emoticon') {
        emoticon = this.value.split('');
        this.mouth = emoticon.pop();
        this.nose = emoticon.pop();
        this.face = emoticon.join('');
        if (this.face === '') {
          this.face = this.nose;
          this.nose = null;
        }
      }
    }
    Instruction.prototype.toString = function() {
      return this.value;
    };
    return Instruction;
  })();
  Parser = (function() {
    function Parser(code) {
      var match, rComment, rEmoticon, rNewLine, rNumber, rSpace, rWord, source, token;
      rEmoticon = /^([^\s]+[OC<>\[\]VD@PQ7L#${}\\\/()|3E*])(\s|$)/;
      rNumber = /^-?\d+/;
      rSpace = /^[ \t\v]+/;
      rNewLine = /^(\n)/;
      rComment = /^\*\*([^*]|\*[^*])*\*\*/;
      rWord = /^([^\s]+)\s*/;
      source = [];
      while (code) {
        if (match = code.match(rSpace)) {
          match = match[0];
        } else if (match = code.match(rNewLine)) {
          match = match[0];
        } else if (match = code.match(rComment)) {
          match = match[0];
        } else if (match = code.match(rEmoticon)) {
          match = match[1];
          token = new Instruction(match, 'emoticon');
          source.push(token);
        } else if (match = code.match(rNumber)) {
          match = match[0];
          token = new Instruction(parseInt(match), 'data');
          source.push(token);
        } else if (match = code.match(rWord)) {
          match = match[1];
          token = new Instruction(match, 'data');
          source.push(token);
        }
        code = code.slice(match.length);
      }
      return source;
    }
    return Parser;
  })();
  Interpreter = (function() {
    function Interpreter(_arg) {
      var source;
      source = _arg.source, this.print = _arg.print, this.input = _arg.input, this.result = _arg.result, this.logger = _arg.logger;
      source.unshift('START');
      this.lists = {
        X: [1],
        Z: source,
        A: [':'],
        G: [],
        S: [' '],
        E: [],
        ':': []
      };
    }
    Interpreter.prototype.debug = function() {
      var i, log, v, _ref;
      if (!(this.logger != null)) {
        return false;
      }
      this.logger("step " + (this.left('X')));
      log = '';
      _ref = this.lists;
      for (i in _ref) {
        v = _ref[i];
        log += ("\n" + i + ": ") + v.toString();
      }
      return this.logger(log);
    };
    Interpreter.prototype.closestDivideOrClose = function(index) {
      var list;
      list = this.lists['Z'];
      while (index < list.length) {
        if (list[index].mouth === ')') {
          return index;
        } else if (list[index].mouth === '|') {
          this.lists['G'][0] = 'IF';
          return index;
        }
        index++;
      }
      return infinity;
    };
    Interpreter.prototype.closestDivide = function(index) {
      var list;
      list = this.lists['Z'];
      while (index < list.length) {
        if (list[index].mouth === ')') {
          return index;
        }
        index++;
      }
      return infinity;
    };
    Interpreter.prototype.left = function(listName) {
      return this.lists[listName][0];
    };
    Interpreter.prototype.right = function(listName) {
      return this.lists[listName][this.lists[listName].length - 1];
    };
    Interpreter.prototype.putRight = function(listName, dataItem) {
      return this.lists[listName].push(dataItem);
    };
    Interpreter.prototype.putLeft = function(listName, dataItem) {
      return this.lists[listName].unshift(dataItem);
    };
    Interpreter.prototype.currentList = function() {
      return this.left('A');
    };
    Interpreter.prototype.clone = function(listName) {
      var list, v, _i, _len, _results;
      list = this.lists[listName];
      if (list.map != null) {
        return list.map(function(x) {
          return x;
        });
      }
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        v = list[_i];
        _results.push(v);
      }
      return _results;
    };
    Interpreter.prototype.run = function() {
      var cont, i;
      cont = true;
      i = 0;
      while (cont && typeof cont !== "function") {
        i++;
        this.debug();
        cont = this.step();
      }
      if (typeof cont === "function") {
        cont();
      } else {
        if (typeof this.result === "function") {
          this.result(this.lists);
        }
      }
      return this.lists;
    };
    Interpreter.prototype.step = function() {
      var instruction, ret;
      instruction = this.lists['Z'][this.left('X')];
      if (!instruction) {
        return false;
      }
      if (!(instruction instanceof Instruction)) {
        instruction = new Parser(instruction)[0];
      }
      if (instruction.type === 'data') {
        this.putRight(this.currentList(), instruction.value);
        this.lists['X'][0]++;
      } else if (instruction.type === 'emoticon') {
        ret = this.execute(instruction);
        this.lists['X'][0]++;
        return ret;
      }
      return true;
    };
    Interpreter.prototype.execute = function(instruction) {
      var condition, count, currentList, face, insertIndex, isReplace, item, list, marker, mouth, nextInstruction, nose, numToReplace, numToRotate, operand1, operand2, pull, put, replaced, tmp, v, x, _i, _j, _len, _len2, _ref, _ref2;
      mouth = instruction.mouth;
      nose = instruction.nose;
      face = instruction.face;
      if (face.length === 1 && face[0] === ':') {
        list = this.lists[':'];
      } else if (face.length === 2 && face[1] === ':' && face[0] in this.lists) {
        face = face[0];
        list = this.lists[face];
      } else {
        if (!this.lists[face]) {
          list = this.lists[face] = [];
        } else {
          list = this.lists[face];
        }
      }
      switch (mouth) {
        case 'O':
          this.lists['A'][0] = face;
          break;
        case 'C':
          this.lists[this.currentList()].unshift(list.length);
          break;
        case '<':
          this.putLeft(face, this.lists[this.currentList()].shift());
          break;
        case '>':
          this.putRight(face, this.lists[this.currentList()].pop());
          break;
        case '[':
          this.putLeft(face, this.left(this.currentList()));
          break;
        case ']':
          this.putRight(face, this.right(this.currentList()));
          break;
        case 'V':
          numToReplace = this.lists[':'].shift();
          insertIndex = this.lists[':'].shift();
          currentList = this.clone(this.currentList());
          while (currentList.length) {
            item = currentList.shift();
            isReplace = numToReplace > 0 ? 1 : 0;
            numToReplace--;
            replaced = list.splice(insertIndex, isReplace, item);
            insertIndex++;
            if (isReplace) {
              this.putRight(':', replaced[0]);
            }
          }
          break;
        case 'D':
          this.lists[face] = list = this.clone(this.currentList());
          break;
        case '@':
          numToRotate = this.lists[this.currentList()][0];
          for (x = numToRotate; numToRotate <= 1 ? x <= 1 : x >= 1; numToRotate <= 1 ? x++ : x--) {
            this.putLeft(face, list.pop());
          }
          break;
        case 'P':
          this.print(list[0].toString());
          break;
        case 'Q':
          this.print(list.shift().toString());
          break;
        case '7':
          tmp = [];
          _ref = list.shift().split('');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            v = _ref[_i];
            tmp.push(v);
          }
          this.lists[face] = list = tmp.concat(list);
          break;
        case 'L':
          tmp = [];
          _ref2 = list.pop().split('');
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            v = _ref2[_j];
            tmp.push(v);
          }
          this.lists[face] = list.concat(tmp);
          break;
        case '#':
          count = this.lists[this.currentList()][0];
          tmp = isNaN(count) ? list.splice(0, list.length) : list.splice(0, count);
          tmp = nose === '~' ? tmp.join(' ') : tmp.join('');
          list.unshift(tmp);
          break;
        case '$':
          count = this.lists[this.currentList()][this.lists[this.currentList()].length - 1];
          tmp = list.splice(-count, count);
          tmp = nose === '~' ? tmp.join(' ') : tmp.join('');
          list.push(tmp);
          break;
        case '{':
        case '}':
          put = function(item) {
            if (mouth === '{') {
              return list.unshift(item);
            } else {
              return list.push(item);
            }
          };
          pull = function() {
            if (mouth === '{') {
              return list.shift();
            } else {
              return list.pop();
            }
          };
          operand1 = pull();
          operand2 = pull();
          switch (nose) {
            case '+':
              put(operand1 + operand2);
              break;
            case '-':
              put(operand1 - operand2);
              break;
            case 'x':
              put(operand1 * operand2);
              break;
            case '/':
              put(operand1 / operand2);
              break;
            case '\\':
              put(operand1 % operand2);
          }
          break;
        case '\\':
        case '/':
          put = __bind(function(item) {
            if (mouth === '\\') {
              return this.lists[':'].unshift(item.toString().toUpperCase());
            } else {
              return this.lists[':'].push(item.toString().toUpperCase());
            }
          }, this);
          operand1 = mouth === '\\' ? this.left(this.currentList()) : this.right(this.currentList());
          operand2 = mouth === '\\' ? this.left(face) : this.right(face);
          switch (nose) {
            case '=':
              put(operand1 === operand2);
              break;
            case '>':
              put(operand1 > operand2);
              break;
            case '<':
              put(operand1 < operand2);
              break;
            case '~':
              put(operand1 !== operand2);
          }
          break;
        case '(':
          this.lists['G'].push(this.lists['X'][0]);
          break;
        case ')':
          marker = this.lists['G'].pop();
          nextInstruction = marker === 'IF' ? this.lists['X'][0] : marker - 1;
          this.lists['X'][0] = nextInstruction;
          break;
        case '|':
          this.lists['X'][0] = this.closestDivide(this.lists['X'][0]);
          break;
        case '3':
        case 'E':
          condition = this.left(':');
          if (condition === 'TRUE') {
            this.lists['X'][0] = this.closestDivideOrClose(this.lists['X'][0]);
          }
          if (mouth === 'E' && condition === 'TRUE' || condition === 'FALSE') {
            this.lists[':'].shift();
          }
          break;
        case '*':
          return __bind(function() {
            return this.input(__bind(function(result) {
              var word, _k, _len3;
              result = result.split(/[ \t\v]+/);
              for (_k = 0, _len3 = result.length; _k < _len3; _k++) {
                word = result[_k];
                this.putRight(this.currentList(), word);
              }
              return this.run();
            }, this));
          }, this);
      }
      return true;
    };
    return Interpreter;
  })();
  window.Emoticon = {
    Parser: Parser,
    Interpreter: Interpreter
  };
}).call(this);
