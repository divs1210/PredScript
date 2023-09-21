const { Set } = require("immutable");

const TokenType = Set([
    // Single-character tokens.
    "LEFT_PAREN", "RIGHT_PAREN", 
    "LEFT_BRACE", "RIGHT_BRACE",
    "COMMA", "DOT", "COLON", "SEMICOLON",
    "MINUS", "PLUS", "SLASH", "STAR",
    
    // One or two character tokens.
    "BANG", "BANG_EQUAL",
    "EQUAL", "EQUAL_EQUAL",
    "GREATER", "GREATER_EQUAL",
    "LESS", "LESS_EQUAL",
    
    // Literals.
    "SYMBOL", "STRING", "NUMBER",
    
    // Keywords.
    "AND", "OR",
    "IF", "ELSE", 
    "TRUE", "FALSE",
    "MULTIFN", 
    "NULL",
    "LET", "LOOP", "RECUR",
    "EOF"
]);

const Keywords = {
    else:     'ELSE',
    false:    'FALSE',
    for:      'FOR',
    function: 'MULTIFN',
    if:       'IF',
    null:     'NULL',
    true:     'TRUE',
    let:      'LET',
    loop:     'LOOP',
    recur:    'RECUR'
};

function Token (type, lexeme, literal, line) {
    return {
        type:     type,
        lexeme:   lexeme,
        literal: literal,
        line:    line,
    };
}

// STATIC
// ==================================
let hadError = false;

function parseError(line, msg) {
    report(line, "", msg)
}

function report(line, where, msg) {
    console.error(`[line ${line}] Error${where}: ${msg})`);
    hadError = true;
}
// ==================================

class Scanner {
    constructor(source) {
        this.source  = source;
        this.tokens  = [];
        this.start   = 0;
        this.current = 0;
        this.line    = 1;
    }
    
    scanTokens() {
        while(!this.isAtEnd()) {
            // We are at the beginning of the next lexeme.
            this.start = this.current;
            this.scanToken();
        }
        
        this.tokens.push(Token("EOF", "", null, this.line));
        
        return this.tokens;
    }
    
    scanToken() {
        let ch = this.advance();
        switch (ch) {
            case '(': this.addToken('LEFT_PAREN');  break;
            case ')': this.addToken('RIGHT_PAREN'); break;
            case '{': this.addToken('LEFT_BRACE');  break;
            case '}': this.addToken('RIGHT_BRACE'); break;
            case ',': this.addToken('COMMA');       break;
            case '.': this.addToken('DOT');         break;
            case ':': this.addToken('COLON');       break;
            case ';': this.addToken('SEMICOLON');   break;
            case '-': this.addToken('MINUS');       break;
            case '+': this.addToken('PLUS');        break;
            case '*': this.addToken('STAR');        break;
            case '!': this.addToken(this.match('=') ? 'BANG_EQUAL'  : 'BANG');      break;
            case '=': this.addToken(this.match('=') ? 'EQUAL_EQUAL' : 'EQUAL');     break;
            case '<': this.addToken(this.match('=') ? 'LESS_EQUAL'  : 'LESS');      break;
            case '>': this.addToken(this.match('=') ? 'GREATER_EQUAL' : 'GREATER'); break;
            case '/':
                if (this.match('/')) {
                    // comment
                    while (this.peek() != '\n' && !this.isAtEnd())
                    this.advance();
                } else {
                    // slash
                    this.addToken('SLASH');
                } break;
            // whitespace
            case ' ' :
            case '\r':
            case '\t': break;
            case '\n': this.line++; break;
            // strings
            case '"': this.string(); break;
            // unknown
            default: 
                if (this.isDigit(ch))
                    this.number();
                else if (this.isAlpha(ch))
                    this.symbol();
                else
                    parseError(this.line, `Unexpected character: ${ch}`);
        }
    }

    string() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n')
                this.line++;

            this.advance();
        }

        if (this.isAtEnd()) {
            parseError(this.line, "Unterminated string.");
            return;
        }

        // The closing ".
        this.advance();
        
        // Trim the surrounding quotes.
        let value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken("STRING", value);
    }

    number() {
        while (this.isDigit(this.peek()))
            this.advance();
        
        // Look for a fractional part.
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            advance();
            
            while (this.isDigit(this.peek()))
                this.advance();
        }

        this.addToken(
            'NUMBER', 
            Number.parseFloat(
                this.source.substring(
                    this.start, this.current)));
    }

    symbol() {
        while (this.isAlphaNumeric(this.peek()))
            this.advance();
    
        let text = this.source.substring(this.start, this.current);
        let type = Keywords[text] || 'SYMBOL';
        this.addToken(type);
    }

    isAlpha(ch) {
        return (ch >= 'a' && ch <= 'z')
            || (ch >= 'A' && ch <= 'Z')
            ||  ch == '_';
    }
    
    isAlphaNumeric(ch) {
        return this.isAlpha(ch) 
            || this.isDigit(ch);
    }

    isDigit(ch) {
        return ch >= '0' && ch <= '9';
    }
    
    peek() {
        if (this.isAtEnd()) 
        return '\0';
        
        return this.source[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.source.length) 
            return '\0';
        
        return this.source[this.current + 1];
    }
    
    advance() {
        return this.source[this.current++];
    }
    
    match(expectedChar) {
        if (this.isAtEnd())
            return false;
        if (this.source[this.current] != expectedChar) 
            return false;
        
        this.current++;
        return true;
    }
    
    addToken(type, literal) {
        literal = literal || null;
        let text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }
    
    isAtEnd() {
        return this.current >= this.source.length;
    }
}

module.exports = {
    Scanner
};