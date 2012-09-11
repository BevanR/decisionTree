/**
 * Decision tree parsing algorithm.
 *
 * @see README.txt
 */

// @todo Document this.

/*jslint white: true, devel: true */
var jQuery;
jQuery = jQuery || false;

(function($){
  // @todo Don't use strict mode in production.
  "use strict";

  jQuery.fn.decisionTree = function(tree, options) {
    var $el, id, name, label, questions, decisions, factors, /* Functions: */ process, ask, answer, update, orphans, requirements, complete, next, asked, markup, average, debug;

    $el = this;
    id = options.id || Math.floor(Math.random() * 1000);
    name = options.name || 'decision-tree[' + id + ']';
    label = options.label || '- Select';

    questions = [];
    decisions = options.decisions || {};
    factors = {};

    process = function(node, parent) {
      var i;

      if (parent) {
        node.parent = parent;
      }

      // Nodes on the tree usually alternate between questions and nodes.  But sometimes a question can have more questions as it's options, if for example the tree knows that the decision has already been made, but needs to fork.
      if (node.options) {
        ask(node);
      }
      // Nodes must have either a value, factor or list of questions.
      else if (typeof(node.value) !== 'undefined') {
        complete(node.value);
      }
      else if (node.factor) {
        factors[node.parent] = node.factor;
        next();
      }
      else if (node.questions && node.questions.length) {
        for (i = 1; i < node.questions.length; i = i + 1) {
          node.questions[i - 1].next = node.questions[i];
        }
        ask(node.questions[0]);
      }
      else if (!next()) {
        // No value found.
        complete();
      }
    };

    ask = function(question) {
      // Ask the next question if it's requirements are not met.
      if (question.requirements && !requirements(question.requirements)) {
        if (question.next) {
          ask(question.next);
        }
        else {
          next();
        }
      }
      else if (decisions[question.key] && !question.ask) {
        answer(question, decisions[question.key]);
      }
      else {
        questions.push(question);
        question.$select = markup(question);
        question.$select.bind('change', update);
        if (decisions[question.key]) {
          question.$select.val(decisions[question.key]);
          answer(question, decisions[question.key]);
        }
      }
    };

    answer = function(question, decision) {
      var child;

      decisions[question.key] = decision;

      child = question.options[decision] || question.options['default'];
      if (child) {
        if (typeof(child) === 'number') {
          complete(child);
        }
        else {
          process(child, question.key);
        }
      }
      else {
        alert('Using an average');
        console.debug(question.options);
        complete(average(question.options));
      }
    };

    // Updates after a UI change.
    update = function() {
      var $this, question;
      $this = $(this);
      question = $this.data('decision-tree-question');
      debug();
      if (decisions[question.key]) {
        orphans(question);
      }
      answer(question, $this.val());
      debug();
    };

    orphans = function(updated) {
      var i, question, orphan;
      for (i in questions) {
        if (questions.hasOwnProperty(i)) {
          // @todo Younger siblings of the updated question are not orphans.
          question = questions[i];
          if (orphan) {
            question.$select.remove();
            delete(questions[i]);
          }
          else {
            orphan = (updated === question);
          }
          if (orphan) {
            delete(decisions[question.key]);
            delete(factors[question.key]);
          }
        }
      }
      $el.trigger('decisionTree.incomplete');
    };

    requirements = function(criteria, next) {
      var key;
      for (key in criteria) {
        if (criteria.hasOwnProperty(key)) {
          if (typeof(criteria[key]) === 'string') {
            if (decisions[key] !== criteria[key]) {
              return false;
            }
          }
          else if (criteria[key].indexOf(decisions[key]) < 0) {
            return false;
          }
        }
      }
      return true;
    };

    complete = function(value) {
      var i;
      for (i in factors) {
        if (factors.hasOwnProperty(i)) {
          value *= factors[i];
        }
      }
      $el.trigger('decisionTree.complete', value);
      debug();
    };

    next = function() {
      var i;
      for (i = questions.length - 1; i >= 0; i = i - 1) {
        if (questions[i] && questions[i].next) {
          if (!asked(questions[i].next)) {
            ask(questions[i].next);
            return true;
          }
        }
      }
    };

    asked = function(question) {
      return questions.indexOf(question) >= 0;
    };

    markup = function(question) {
      var idAttr, $select, value, node, i;
      idAttr = 'decision-tree-' + id + '-question-' + question.key;

      $select = $('<select id="' + idAttr + '" name="' + name + '[' + question.key + ']" class="decision-tree-question"><option class="default" disabled="disabled">' + label + ' ' + question.label + '</option></select>');

      for (value in question.options) {
        if (question.options.hasOwnProperty(value)) {
          node = question.options[value];
          if (!node.requirements || requirements(node.requirements)) {
            $select.append('<option value="' + value + '">' + (node.label || node) + '</option>');
          }
        }
      }

      return $select
        .data('decision-tree-question', question)
        .appendTo($el)
        .hide()
        .fadeIn();
    };

    average = function(values) {
      var i, value, count;
      value = 0;
      count = 0;
      for (i in values) {
        if (values.hasOwnProperty(i) && typeof(values[i]) === 'number') {
          value += values[i];
          count = count + 1;
        }
        // @todo Else, consider attempting to convert the value to a number.
      }
      return value / count;
    };

    debug = function() {
      if (typeof(console.debug) === 'function') {
        console.debug({
          '$el': $el,
          'id': id,
          'name': name,
          'questions': questions,
          'decisions': decisions,
          'factors': factors
        });
      }
    };

    process(tree);

    return this;
  };
}(jQuery));
