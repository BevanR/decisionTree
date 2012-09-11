# Decision Tree

An algorithm & user interface component (for web pages) to parse and make decisions through a tree of nested inter-dependent questions.  This javascript implementation depends on jQuery but that dependency is easy to remove.

## Usage

The UI component is initialized as a jQuery plugin;

```javascript
jQuery('#my-decision-tree-wrapper').decisionTree(myQuestionTree, options);
```

## Events

The `decisionTree.complete` and `decisionTree.incomplete` events are triggered when the decision-maker (user) has reached a decision or changed an old decision after having reached a decision.

```javascript
jQuery('#my-decision-tree-wrapper')
  .decisionTree(myQuestionTree, options)
  .bind('decisionTree.complete', function() {
    alert('You answered all the questions!');
    console.log('The user reached an endpoint in the decision tree.');
  })
  .bind('decisionTree.incomplete', function() {
    console.log('The user changed a previous decision.');
  });
```

## Question tree

Each point (node) in the question tree (`myQuestionTree` in the examples above) is either a *Question* or a *Node*.  The tree parameter as passed to jQuery.decisionTree() can be either a Node or a Question.

### Node

A Node should have a `label` property; This is used as the display value when asking the Node's parent question.  If root element at the top of the tree _is_ a node, then the label is not used.

Nodes should have at least one of the following properties.  If it has more than one of these properties, then only the first encountered one (in the following order) is used;

* `value`;  This indicates an endpoint in the tree was reached, and the value is the final decision.  This is currently limited to numeric values.
* `factor`;  This decision affects the final value by being multiplied to it, and thus must also be a number.
* `questions`:  An array of Questions to be answered.

If a node is reached and it does not have one of those properties "decisionTree.complete" event will fire but with undefined or zero value.

### Question

A Question must have a `key` property.  This is used to identify this question in the decision tree, and identify answers without asking if a question with the same key is repeated.

A Question must have an `options` property.  This is an object whose property names are the values to be stored in the decision table, and whose values are either a Node or a final value.  The final value is equivalent to a node with only a `value` property and no `label`.

A Question may have a `label` property, even if it is the root of the question tree.  It is used as the label for the question.

If there is no `label` property and the question has an answer in the decision table, then that answer is used to make the decision, and no markup is rendered in the UI to ask the decision-maker.

A Question may have a `requirements` property, which is an object, whose property names are keys in the decision table, and whose values are the values of those decisions in the decision table.  If the Question has a requirements property, then all the requirements must match the decisions in the decision table.  The value of a requirement can also be an array of possible values that meet the requirements for the question.

## Decision table

The decision table is an object representing a simple key-value table, where the key is the Question's `key` and the value is the decision (the answer for that question).  The decision table can be pre-populated via `options.decisions` when invoking `jQuery.decisionTree()`.

## Options

Options can be passed to decisionTree like this;

```
var options = {
  id: 'type-picker',
  name: 'type-picker[0]',
  selectLabel: 'Pick your',
  decisions: {
    color: 'red',
    type: 'round'
  }
};
jQuery('#my-decision-tree-wrapper').decisionTree(myQuestionTree, options);
```

All options are optional.

* `id` is used in ID attributes and should be unique for every instance of decisionTree.
* `name` is used in `name=""` attributes and becomes the key in the POST or GET request for the form.  It should probably also be unique per decisionTree instance.
* `selectLabel` is used in the first default disabled option of `<select>` elements as a prefix for the Question label.  So if the label is "Color" and `selectLabel` is "Pick your", the select element's label is "Pick your Color".
* `decisions` instantiates the decision table with decisions.  These could be restored from the database, or determined by some context.  For any decisions provided this way, the question will only be asked if it has a `label`.  In this way questions can be suppressed; answered without asking the decision maker through the UI.
