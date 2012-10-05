/**
 * Decision tree parsing algorithm.
 *
 * @see README.md
 */

/*jslint white: true, devel: true, browser: true */
/*global jQuery*/

// Provide closure.
(function($){
  "use strict";

  // Implement as a jQuery plugin.
  jQuery.fn.decisionTree = function(tree, options) {

    // The `this` variable is already a jQuery object.
    this.each(function() {

      // Declare all vars & functions so the scope is unambiguous.
      var $el, id, name, label, questions, $selects, decisions, factors, value,
        /* Functions: */
        process, ask, answer, next, complete, update, orphans, requirements, asked, markup, average, debug;

      $el = $(this);
      options = options || {};
      // Create a unique ID for this decision tree instance.
      id = options.id || Math.floor(Math.random() * 1000);
      // Use the unique ID to form the the <input name=""> attributes.
      name = options.name || 'decision-tree[' + id + ']';
      label = options.label || '- Select';

      // Track the asked questions.  They may be unanswered.
      questions = [];
      // Track UI elements by question key to suppress duplicate questions from
      // the UI.
      $selects = {};
      // The decision table stores answers to questions (aka "decisions").
      // Allow previously stored and retrieved decision tables to be restored.
      decisions = options.decisions || {};
      // Store factors that will by multiplied to the final value.
      factors = {};

      /**
       * Process a node (or question)
       *
       * @param node
       *    The node to be processed.  This may also be a question.
       * @param parent
       *    The key of the question which is a parent to this node.
       */
      process = function(node, parent) {
        var i;

        if (parent) {
          node.parent = parent;
        }

        // Each generation in the tree usually alternates between nodes and
        // questions.  I.e.; Questions are usually children of nodes, and nodes
        // are usually children of questions.  But questions may also be
        // children of questions.  This may occur when a question tree knows
        // that there is already an answer to the question in the decision
        // table.
        if (node.options) {
          // This node is actually a question.
          ask(node);
        }
        // Nodes must have either a value, a factor or list of questions.
        else if (typeof(node.value) !== 'undefined') {
          next(node.value);
        }
        else if (node.factor) {
          // Store the factor in the factors table & go to the next question.
          factors[node.parent] = node.factor;
          next();
        }
        else if (node.questions && node.questions.length) {
          // Link each question to it's next sibling.
          for (i = 1; i < node.questions.length; i = i + 1) {
            node.questions[i - 1].next = node.questions[i];
          }
          // Ask the first question.
          ask(node.questions[0]);
        }
        else {
          next();
        }
      };

      /**
       * Asks a question, or answers it immediately if the answer is known.
       *
       * @param question
       *    Question object describing the question to be asked.
       */
      ask = function(question) {
        var decision, node;

        // Keep track of which questions have been asked.
        questions.push(question);

        // If this question's requirements are not valid, ask the next one.
        if (!requirements(question)) {
          if (question.next) {
            ask(question.next);
          }
          else {
            next();
          }
        }
        else {
          // Check the decisions table if this question has been answered.
          decision = decisions[question.key];

          // Only ask answered questions in the UI if they have a label & no UI.
          if (decision && ($selects[question.key] || !question.label)) {
            // Skip the markup in the UI to answer this question.
            answer(question, decision);
          }
          else {
            // Ask this question with markup in the UI.
            question.$select = markup(question);
            $selects[question.key] = question.$select;

            // Update the decision tree when the answer is changed.
            question.$select.bind('change', update);

            // Answer the question in the UI if there is a valid answer already.
            if (decision && question.options[decision] && requirements(question.options[decision])) {
              question.$select.val(decision);
              answer(question, decision);
            }
          }
        }
      };

      /**
       * Answer a question.
       *
       * @param question
       *    A question object.
       * @param decision
       *    The answer to the question.
       */
      answer = function(question, decision) {
        var child;

        // Store the answer in the decision table.
        decisions[question.key] = decision;

        // Disable the label <option> for this question.
        if (question.$select) {
          question.$select.addClass('answered');
          question.$select.find('option.default').attr('disabled', 'disabled');
        }

        // Determine which child node to descend into.
        child = question.options[decision] || question.options['default'];

        if (child) {
          if (typeof(child) === 'number') {
            // If the next node is a number, it is the final value.
            next(child);
          }
          else {
            // Descend in the tree to process the child node.
            process(child, question.key);
          }
        }
        else {
          // Attempt to calculate an average if there are no matching children
          // and no default child.
          next(average(question.options));
        }
      };

      /**
       * Determine what to do next.
       *
       * @param parameter
       *    Optional; The final value.
       */
      next = function(parameter) {
        var i;

        // Store the final value if it was passed in as an argument.
        if (typeof(parameter) !== 'undefined') {
          value = parameter;
        }

        // Look for any unasked sibling questions of any asked questions.
        // Search through *most recent* questions first.
        for (i = questions.length - 1; i >= 0; i = i - 1) {
          if (questions[i] && questions[i].next && !asked(questions[i].next)) {
            // Ask the first unasked question encountered.
            ask(questions[i].next);
            return;
          }
        }

        // If there are no unasked siblings, there is nothing left to do.
        complete(value);
      };

      /**
       * Calculate the final value and return the result.
       *
       * @param result
       *    The final value.
       */
      complete = function(result) {
        var i;

        // Multiply the factors.
        for (i in factors) {
          if (factors.hasOwnProperty(i)) {
            result *= factors[i];
          }
        }

        // Build a result object with all the important bits.
        result = {
          'value': result,
          'factors': factors,
          'decisions': decisions
        };

        // Notify that the decision tree has reached a complete state.
        // Always call from a seperate event so that a decisionTree() caller can
        // finish binding to decisionTree events, even if the decision tree
        // completes in the same event as initialization; such as when
        // decisionTree() is used primarily to get a result from a questionTree,
        // rather than for the UI.
        setTimeout(function() {
          $el.trigger('decisionTree.complete', result);
        }, 0);
      };

      /**
       * Handle updates when an answer is selected or changed in the UI.
       */
      update = function() {
        var $select, question;

        // Get the question object for the question that was answered/changed.
        $select = $(this);
        question = $select.data('decision-tree-question');

        // If the question already has an answer in the decision table, remove
        // the child questions that are now irrelevant.
        if (decisions[question.key]) {
          orphans(question);
        }

        // Process the (new) answer to the question.
        answer(question, $select.val());
      };

      /**
       * Remove questions no-longer relevant because a parent's answer changed.
       *
       * @param updated
       *    The question that changed.
       */
      orphans = function(updated) {
        var i, question, orphan;

        // Iterate over questions in the order they were asked.
        for (i in questions) {
          if (questions.hasOwnProperty(i)) {
            question = questions[i];
            if (orphan) {
              // This question was asked *after* the updated question.
              // Remove it from the stack of asked questions.
              delete(questions[i]);

              // Remove it from the UI if it has a UI element.
              if (question.$select) {
                question.$select.remove();
                delete(question.$select);
                delete($selects[question.key]);
              }
            }
            else {
              // This is the updated question.  Turn the orphan flag on.
              orphan = (updated === question);
            }

            // Clear factors for the updated question and following questions.
            if (orphan) {
              delete(factors[question.key]);
            }
          }
        }

        // Notify that the decision tree has moved into an incomplete state.
        $el.trigger('decisionTree.incomplete');
      };

      /**
       * Checks if a node or questions requirements are met.
       *
       * @param node
       *    The node or question to check requirements for.
       *
       * @return Boolean
       *    True if requirements are met.
       */
      requirements = function(node) {
        var criteria, key;

        // If no requirements are defined then the requirements are met.
        if (node.requirements) {
          criteria = node.requirements;

          // Check each criterion.
          for (key in criteria) {
            if (criteria.hasOwnProperty(key)) {

              // If this criterion is a value, check it matches the decision.
              if (typeof(criteria[key]) === 'string') {
                if (decisions[key] !== criteria[key]) {
                  // The requirements are not met.
                  return false;
                }
              }

              // Check if the decision is found in the criterion's array of
              // possible matches.
              else if (criteria[key].indexOf(decisions[key]) < 0) {
                // The requirements are not met.
                return false;
              }
            }
          }
        }

        // The requirements are met.
        return true;
      };

      /**
       * Checks if a question has been asked.
       *
       * @param question
       *    The question to check.
       *
       * @return Boolean
       *    True if the question has been asked.  False if not.
       */
      asked = function(question) {
        return questions.indexOf(question) >= 0;
      };

      /**
       * Build and append DOM to ask a question via the UI.
       *
       * @param question
       *    The question to be asked.
       *
       * @return jQuery
       *    A jQuery object for the element that was appended to the DOM.
       */
      markup = function(question) {
        var idAttr, $select, value, node;

        // Assemble the unique identifier for this question's <select> element.
        idAttr = 'decision-tree-' + id + '-question-' + question.key;

        // Render the markup and turn it into a jQuery-wrapped DOM element.
        // Include the default <option> which is the question's label.
        $select = $('<select id="' + idAttr + '" name="' + name + '[' + question.key + ']" class="decision-tree-question"><option class="default">' + label + ' ' + question.label + '</option></select>');

        // Iterate over the nodes to add the options for this question.
        for (value in question.options) {
          if (question.options.hasOwnProperty(value) && requirements(question.options[value])) {
            node = question.options[value];
            $select.append('<option value="' + value + '">' + (node.label || node) + '</option>');
          }
        }

        // Return the jQuery object after attaching the question object to it,
        // adding the <select> element to the document, and animating it.
        return $select
          .data('decision-tree-question', question)
          .appendTo($el)
          .hide()
          .fadeIn();
      };

      /**
       * Find the average of a set of values.
       *
       * @param values
       *    The values to be averaged.
       *
       * @return Number
       *    The average.
       */
      average = function(values) {
        var i, value, count;
        value = 0;
        count = 0;
        for (i in values) {
          if (values.hasOwnProperty(i) && typeof(values[i]) === 'number') {
            value += values[i];
            count = count + 1;
          }
        }
        return value / count;
      };

      /**
       * Debug the current state of the decisionTree.
       */
      debug = function() {
        if (typeof(console.log) === 'function') {
          console.log({
            '$el': $el,
            'id': id,
            'name': name,
            'value': value,
            'questions': questions,
            '$selects': $selects,
            'decisions': decisions,
            'factors': factors
          });
        }
      };

      // Apply the same question tree to each element in the jQuery object.
      process(tree);
    });

    // Allow chaining.
    return this;
  };
}(jQuery));
