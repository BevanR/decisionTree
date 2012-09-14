# Decision Tree

An algorithm & user interface component (for web pages) to parse and make decisions through a tree of nested questions with dependencies.  This javascript implementation depends on jQuery but that dependency is easy to remove.

## Usage

A Decision Tree is initialized as a jQuery plugin;

```javascript
jQuery('#my-decision-tree-wrapper').decisionTree(myQuestionTree, options);
```

## Events

* `decisionTree.complete` is triggered when the decision-maker (the user) has no more questions pending.
* `decisionTree.incomplete` is triggered when an old decision is changed and there are now pending questions once again.

```javascript
jQuery('#my-decision-tree-wrapper')
  .decisionTree(myQuestionTree, options)
  .bind('decisionTree.complete', function(result) {
    alert('You answered all the questions!');
    console.log('The user reached an endpoint in the decision tree: ' + result.value);
    console.debug(result.factors);
    console.debug(result.decisions);
  })
  .bind('decisionTree.incomplete', function() {
    console.log('The user changed a previous decision.');
  });
```

## Options

Options can be passed to the Decision Tree algorithm like this:

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

* `id`, String:  Used in ID attributes and should be unique for every instance of decisionTree.
* `name`, String:  Used in `name=""` attributes and becomes the key in the `POST` or `GET` request for the form.  In most cases it should be unique and/or end with a square bracket component.  E.g. `my-decision-tree[2]`.
* `selectLabel`, String:  Used in the first default disabled `<option>` of `<select>` elements as a prefix for the Question label.  So if the label is "_Color_" and `selectLabel` is "_Pick your_", then the `<select>` element's label becomes "_Pick your Color_".
* `decisions` Object:  Instantiates the decision table with decisions;  Property names are Question keys and values are the answer to the corresponding question.  These could be restored from the database, or determined by some context.  For any decisions provided this way, the corresponding question(s) will only be asked in the UI if the question has a `label`.  Thus Questions can be suppressed from the UI if the answer is already known in the decision table.

## The Decision Table

The decision table is an object representing a simple key-value table, where the key is the Question's `key` and the value is the decision (the answer for that question).  The decision table can be pre-populated via `options.decisions` when invoking `jQuery.decisionTree()`.  This is useful for restoring decision trees that have been saved to the database and retrieved.

## The Question Tree

The first parameter to `jQuery.decisionTree()` is a question tree.  `myQuestionTree` is the question tree in the examples above.

Each node in the question tree is either a *Question* or a *Node*.  The root of the tree—the parameter passed to `jQuery.decisionTree()`—can be either a Node or a Question.

### Node

Nodes may list questions, provide the result value or a factor to modify that value upon completion.  Nodes also contains the UI text representing the value of an option for a Question's answer.

Nodes must have either `value`, `factor`, or `questions`.  The first one of these properties to be encountered will be used to determine how to process the node.  Any others will be ignored.

#### Properties

* `label`, String: The display value used when asking the Node's parent Question.  `label` is ignored if the Node is the root element of the question tree.  All other Nodes should have a `label`.
* `value`, Number:  The result of the decision tree when there are no more questions to be asked.
* `factor`, Number:  Multiplied to the result of the decision upon completion of the decision tree.
* `questions`, Array:  Ordered Questions to be asked to resolve this node.
* `requirements`, Object:  Property names are keys in the decision table.  Value is the permitted value of that decision in the decision table.  If the value is an array, then the decision may match any of the array's values.  If a Node does not have requirements then it is always passes the check for requirements.

### Question

#### Properties

* `key`, String:  Identifies this question in HTML form and HTTP-submitted values.  It also identifies the question's answer in the decision table, and the question's factor in the factor table.  *Required*.
* `options`, Object:  Property names get stored in the decision table.  Values are either a number, a Node or a question.  A numeric result is handled just like a Node with a `value` property but no `label`.  *Required*.
* `label`, String:  Used to build the label for the question.  Questions that are already answered and should not be updateable by the decision-maker should omit a `label`.
* `requirements`, Object:  As per Node `requirements`.
