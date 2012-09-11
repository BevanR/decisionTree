/*jslint white: true, devel: true, undef: true, sloppy: true */
var options = {
  id: 'type-picker',
  name: 'type-picker[0]',
  selectLabel: 'Pick your',
  decisions: {
    color: 'red',
    type: 'round'
  }
};
jQuery('#my-decision-tree-wrapper')
  .decisionTree(myQuestionTree, options)
  .bind('decisionTree.complete', function() {
    alert('You answered all the questions!');
    console.log('The user reached an endpoint in the decision tree.');
  })
  .bind('decisionTree.incomplete', function() {
    console.log('The user changed a previous decision.');
  });
