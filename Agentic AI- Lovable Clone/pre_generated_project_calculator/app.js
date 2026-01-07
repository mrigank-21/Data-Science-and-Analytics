// app.js - Calculator logic implementation

/**
 * Calculator class encapsulating state and operations.
 */
class Calculator {
  /**
   * @param {HTMLInputElement} displayElement - The input element used as the display.
   */
  constructor(displayElement) {
    this.displayEl = displayElement; // reference to #display input
    this.currentInput = '';
    this.lastOperator = null;
    this.result = null;
    this.updateDisplay('');
  }

  /** Append a digit or decimal point to the current input and update display. */
  appendDigit(digit) {
    // Prevent multiple decimal points
    if (digit === '.' && this.currentInput.includes('.')) return;
    this.currentInput += digit;
    this.updateDisplay(this.currentInput);
  }

  /** Store an operator, compute intermediate result if needed. */
  setOperator(op) {
    // If there is a pending input, incorporate it into the result first
    if (this.currentInput !== '') {
      const value = parseFloat(this.currentInput);
      if (this.result === null) {
        this.result = value;
      } else if (this.lastOperator) {
        this.result = this._perform(this.lastOperator, this.result, value);
      }
    }
    // Prepare for next number
    this.lastOperator = op;
    this.currentInput = '';
    // Show the current result (or 0 if not yet set)
    this.updateDisplay(this.result !== null ? String(this.result) : '');
  }

  /** Perform the pending calculation and display the result. */
  calculate() {
    if (this.lastOperator === null) {
      // Nothing to calculate – just show current input if any
      if (this.currentInput !== '') {
        this.updateDisplay(this.currentInput);
      }
      return;
    }
    const right = this.currentInput !== '' ? parseFloat(this.currentInput) : this.result;
    const left = this.result !== null ? this.result : 0;
    const computed = this._perform(this.lastOperator, left, right);
    this.result = computed;
    this.currentInput = '';
    this.lastOperator = null;
    this.updateDisplay(String(this.result));
  }

  /** Reset all state and clear the display. */
  clear() {
    this.currentInput = '';
    this.lastOperator = null;
    this.result = null;
    this.updateDisplay('');
  }

  /** Helper to update the display element's value. */
  updateDisplay(value) {
    this.displayEl.value = value;
  }

  /** Internal method to execute a binary operation. */
  _perform(operator, left, right) {
    switch (operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) {
          throw new Error('Division by zero');
        }
        return left / right;
      default:
        return right; // fallback
    }
  }
}

// Export for testing / module environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Calculator };
} else {
  window.Calculator = Calculator;
}

/**
 * DOMContentLoaded initialization – instantiate calculator and bind UI events.
 */
window.addEventListener('DOMContentLoaded', () => {
  const displayEl = document.getElementById('display');
  const calc = new Calculator(displayEl);

  // Button click handling using event delegation on .buttons container
  const buttonsContainer = document.querySelector('.buttons');
  if (buttonsContainer) {
    buttonsContainer.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const type = target.getAttribute('data-type');
      if (type === 'digit') {
        const val = target.getAttribute('data-value');
        calc.appendDigit(val);
      } else if (type === 'operator') {
        const op = target.getAttribute('data-operator');
        calc.setOperator(op);
      } else if (target.id === 'clear') {
        calc.clear();
      } else if (target.id === 'equals') {
        try {
          calc.calculate();
        } catch (err) {
          calc.updateDisplay('Error');
        }
      }
    });
  }

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    // Digits and decimal point
    if (/^[0-9]$/.test(key) || key === '.') {
      e.preventDefault();
      calc.appendDigit(key);
      return;
    }
    // Operators
    if (['+', '-', '*', '/'].includes(key)) {
      e.preventDefault();
      calc.setOperator(key);
      return;
    }
    // Enter / = for calculation
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      try {
        calc.calculate();
      } catch (err) {
        calc.updateDisplay('Error');
      }
      return;
    }
    // Escape or Backspace for clear
    if (key === 'Escape' || key === 'Backspace') {
      e.preventDefault();
      calc.clear();
      return;
    }
  });
});
