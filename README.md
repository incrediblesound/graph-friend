graph-friend
============

This is a simple node.js social network using Neo4js. I intend it to serve as a basic example and repository of graph/node integration. All the magic happens in routes/index.js.

Features
--------

The app requires new users to select employer or employee status and occupation. The use home page will then display the complementary user in the same field. If the user is a Tech boss, for example, his homepage will display all Tech employees. Clicking on another user's name will 'friend' that user, and the view friends page will display the users friends and friends-of-friends.