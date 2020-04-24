var express = require('express');
var app = express();

app.use('/static', express.static(__dirname + '/public'));
var http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = 3000;

let rooms = new Array();
let roomId = 0;

http.listen(PORT, function(){
    console.log('server listening. Port:' + PORT);
});

io.on('connection', function(socket) {
    socket.join();

    socket.on('GetRooms', () => {
        socket.emit('ReplyGetRooms', getRooms());
    });

    //list: {'roomName': String, 
    //      'passWord': String }
    socket.on('CreateRoom', list => {
        //Create room
        rooms.push(new Room(roomId, list['roomName'], list['passWord']));
        socket.emit('ReplyRoomId', roomId++);
    });

    socket.on('JoinRoom', joinInfos => {
        let playerName = joinInfos['playerName'];
        let roomName = joinInfos['roomName'];
        let passWord = joinInfos['passWord'];
        let cur = getRoom(joinInfos['roomId']);
        let players = cur.players;
        let ps = cur.passWord;
        //Verify password if needed.
        if(ps !== null) {
            if(ps !== passWord) {
                socket.emit('JoinDenied', 'パスワードが違います!');
                return;
            }
        }
        
        let no = cur.addPlayer(playerName);
        if(no !== 0) {
            if(no === 1)
                socket.emit('JoinDenied', 'この部屋はいっぱいです!');
        }
        if(passWord !== null)
            console.log(`Joined: ${roomName}\nPlayer: ${playerName}\nUsing password: Yes`);
        else
            console.log(`Joined: ${roomName}\nPlayer: ${playerName}\nUsing password: No`);
        socket.emit('ReplyJoin', roomId);
    });

});

function getRooms() {
    let retRooms = new Array();
    rooms.forEach(elm => {
        let flg = elm.passWord !== null ? true : false;
        retRooms.push({'roomId': elm.roomId, 'roomName':elm.roomName, 'players': elm.players, 'num': elm.num, 'passFlg': flg});
    });
    return retRooms;
}

function getRoom(id) {
    return rooms.find(elm => elm.roomId === id);
}

class Room {
    constructor(_roomId, _roomName, _passWord) {
        this.roomId = _roomId;
        this.roomName = _roomName;
        this.passWord = _passWord;
        this.num = 0;
        this.players = new Array();
    }
    addPlayer(playerName) {
        if(this.players.length == 2)
            return 1;
        this.players.push(playerName);
        this.num++;
        return 0;
    }
}
