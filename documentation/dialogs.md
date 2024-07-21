## DIALOGS

Dialog system consists of two components - class Dialoger, which created in scene Create function
and of Vue3 based component - DialogerUI. Class Dialoger used for starting and loading dialogs from
json file. It uses common DOM Custom Events.

Most dialog functionality provided by DialogerUI. It accepts one argument in start(dialog) method -
full dialog options and additional data as character name, avatar frame etc. All dialogs always starts
with "welcome" key. Every phrase has unique key. Inside of dialog object are some properties:

text -  main character phrase

options - array of player answers

###Options:

Every option can include next properties:

text - main players answer

next - key of next dialog phrase of this character. Key can be duplicated for different characters. For 
example characters Erick and Michael can both have phrase with the same key "myStory".

condition - key of game.state property to show/hide current option in list. If game.state[condition]
is falsy, options will be hidden.

makeTrue - key of game.state property which will be set as true if player selects current option

makeFalse - key of game.state property which will be set as false if player selects current option

####Dialog variables

It`s possible to use variables from game.dialogsVariables in dialog and option texts. Separate variable 
with % symbols, for example %CITY_NAME%.