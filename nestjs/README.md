# API
In this file, you'll find the list of api created in the back-end.

## /auth/
| Method | Root | Parameters | Return    |
|:----:|:-----:|-------|:-----------|
|GET|login| - |1st time: user logins 42 and gives auth (back-end creates user)<br />2nd time: login only<br />*redirect to localhost:3000*<br />*If user has turned on two factor auth, redirect to localhost:3000/2fa*|
|GET|disconnect| - |Disconnecting user by deleting cookies (jwt's).|

## /2fa/
| Method | Root | Parameters | Return    |
|:----:|:-----:|-------|:-----------|
|Post|generate|-|generate a qrcode<br />*If user has already turned on two factor auth, throw HttpStatus:Bad_Request*|
|Post|turn-on|Body<br />{"twoFactorAuthenticationCode": "xxxxxx"}|an object<br />{"userId": 60191,"twoFactorEnabled": true}<br />*If user didn't scan qrcode first, or user has already turned on two factor auth, throw HttpStatus:Bad_Request*<br />*If user enters wrong code, throw UnauthorizedException*|
|Post|authenticate|Body<br />{"twoFactorAuthenticationCode": "xxxxxx"}|an object<br />{"id": 1,"username": "yi","email": "yi@student.42lyon.fr","twoFA":true}<br />*If user doesn't active two factor auth, throw HttpStatus:Bad_Request*<br />*If user enters wrong code, throw UnauthorizedException*

## /profile/
| Method | Root | Parameters | Return    |
|:----:|:-----:|-------|:-----------|
|GET|me|-|an object<br />`{"id":1,"nickname":"Jo","createDate":"xxx","email":"xxx","isTwoFactorAuthenticationEnabled":true}`|
|GET|all|-|an array contains objects<br />`[{"id":1,"nickname":"Li","createDate":"xxx","email":"xxx","isTwoFactorAuthenticationEnabled":false}, {...}, {...}...]`|
|GET|:id|user id|an object<br />`{"id":1,"nickname":"Jo","createDate":"xxx","email":"xxx","isTwoFactorAuthenticationEnabled":true}`|
|POST||Body <br />`{"nickname":"alphanumeric string (len 10 max, and unique)"}`|an object<br />`{"id":2,"nickname":"Bar","createDate":"xxx"}`<br /> *For testing only, delete later*|
|PATCH|name|Body <br />`{"nickname":"alphanumeric string (len 10 max, and unique)"}`|an object with user's new nickname<br />`{"id": 6,"nickname": "yi","createDate": "xxx","avatar": "url","userStatus": "Available","email": "xxx","isTwoFactorAuthenticationEnabled": false}`<br />*If name format is uncorrect return HttpStatus:Bad_Request*`|
|POST|upload|Body *form data* <br />`{fieldname: 'file', originalname: 'blathersnhpng.png', encoding: '7bit', mimetype: 'image/png',buffer: <>, size: 12 }`|String : Image xxx uploaded successfully !<br />*If file is not jpg, jpeg, png or gif, or file size > 1M, return HttpStatus:NOT_ACCEPTABLE*|
|GET|avatarfile/:id|id: file id| file stream|
## /game/
| Method | Root | Parameters | Return    |
|:----:|:-----:|-------|:-----------|
|GET|all|-|an array contains objects<br />`[{"id": 5, "mode": 1, "status": "Ongoing/Finish", "createDate": "xxx", "updateDate": "xxx", "leftUserId": 3, "leftUserScore": 10, "rightUserId": 1, "rightUserScore": 2,"winnerId": 3}, {}...]`<br />*If a game hasn't finished yet, winner value is null.*|
|GET|ongoing|-|an array contains objects<br />`[{"id": 5, "mode": 1, "createDate": "xxx", "leftUserId": 2, "rightUserId": 1}, {}...]`|
|GET|:id|game id|an object<br />`{"id": 5, "mode": 1, "status": "Ongoing/Finish", "createDate": "xxx", "updateDate": "xxx", "leftUserId": 3, "leftUserScore": 10, "rightUserId": 1, "rightUserScore": 2,"winnerId": 3}`<br />*If a game hasn't finished yet, winner value is null.*<br />*If game id doesn't exit, throw HttpStatus:Not_Found*|
|GET|me/records|-|an array contains objects<br />`[{"gameId": 2, "mode": 1, "createDate": "xxx", "updateDate": "xxx", "userScore": 10, "opponentId": 4, "opponentScore": 1, "userGameStatus": "Won/Lost"}, {}...]`|
|GET|:id/records|user id|an array contains objects<br />`[{"gameId": 2, "mode": 1, "createDate": "xxx", "updateDate": "xxx", "userScore": 10, "opponentId": 4, "opponentScore": 1, "userGameStatus": "Won/Lost"}, {}...]`|
|GET|:id/records|user id|an object with game Id<br /> {"gameId": 1}
|POST|normal|Body<br />`{"leftUserId": number, "rightUserId": number}`|an object with game's mode, id, create time and ongoing status. <br />`{"mode": "Normal", "id": 7, "createDate": "xxx", "updateDate": "xxx","status": Ongoing}`<br />*If one of the users is playing another game currently, throw HttpStatus:Bad_Request*|
|POST|bonus|same as above|same as above, except game mode is Bonus|
|PATCH|:id|game id<br />`{"leftUserScore": number, "rightUserScore": number}`|an object with all details<br />`{"id": 9, "mode": 1, "createDate": "xxx", "updateDate": "xxx", "status": 0, "userGameRecords": [{"id": 16, "userId": 5678, "gameId": 9, "score": 9},{"id": 17,"userId": 60191,  "gameId": 9, "score": 6}], "winner": {"id": 5678, "nickname": "Tim","createDate": "xxx"}}`<br />*If the game has result already, throw HttpStatus:Bad_Request*|
## /relationship/
| Method | Root | Parameters | Return    |
|:----:|:-----:|-------|:-----------|
|GET|me/allusers|-|an array <br />`[{"id": 1,"nickname": "Tim","avatar": "xxx","userStatus": "Available","relationship": null/Friend/Block/Not confirmed},]`|
|GET|me/list|Query<br />?status=friend/notconfirmed/block|an array`[ {"user_id": 1,"user_nickname": "Lo","user_avatar": "xxx","user_userStatus": "Available", "relation_id": 1}, {}...]`|
|GET|:id/list|user id<br />Query<br />?status=friend/notconfirmed/block|an array`[ {"user_id": 1,"user_nickname": "Lo","user_avatar": "xxx","user_userStatus": "Available", "relation_id": 1}, {}...]`|
|POST|add|Body<br />`{"addresseeUserId": number;}`<br />*Note: requester is the login user*|an object with a new relationship id`{"status": "Not confirmed", "id": 3,"createDate": "xxx"}`<br />*If users have existing status: unconfirmed/friend/block, throw HttpStatus:Bad_Request*|
|Patch|accept/:id|relationship id|an object<br />`{"id": 1, "createDate": "xxx", "status": "Friend", "users": [1, 3]}`<br />*If relationship id doesn’t exist, throw HttpStatus:Not_Found; <br /> Relationship status should be NOT CONFIRMED, otherwise throw HttpStatus:Bad_Request*|
|DELETE|reject/:id|relationship id|an object that was deleted <br />`{"createDate": "xxx", "status": "Not confirmed", "users": [1, 3]}`<br />*If relationship id doesn’t exist, throw HttpStatus:Not_Found; <br /> Relationship status should be NOT CONFIRMED, otherwise throw HttpStatus:Bad_Request*|
|DELETE|unfriend|Body<br />`{"addresseeUserId": number;}`<br />*Note: requester is the login user*|an object that was deleted <br />`{"createDate": "xxx", "status": "Friend", "users": [1, 3]}`<br />Users should be friends, other situation would throw HttpStatus:Bad_Request|
|POST|block|Body<br />`{"addresseeUserId": number;}`<br />*Note: requester is the login user*|an object with a new relationship id`{"status": "Block", "id": 3,"createDate": "xxx"}`<br />*If users have existing status: unconfirmed/friend, it will be remove and create the new relationship with status Block.<br />If users already in status Block, throw HttpStatus:Bad_Request.*|
|DELETE|unblock|Body<br />`{"addresseeUserId": number;}`<br />*Note: requester is the login user*|an object that was deleted <br />`{"createDate": "xxx", "status": "Friend", "users": [1, 3]}`<br />User id should be on the blocklist, other situation would throw HttpStatus:Bad_Request|
## /admin/
| Method | Root | Parameters | Return    |
|:----:|:-----:|-------|:-----------|
|PATCH|Body <br />`{"id": 1, "newStatus": "Moderator/User/Banned"}`|an object <br />`{"id": 1, "nickname": "Tim", "avatar": "xxx", "userStatus": "Offline", "siteStatus": "Moderator",}`