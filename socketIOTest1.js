const socket = require("socket.io");
//创建一个websocket服务器
let socketServer = socket.listen(require("http").createServer((req,resp) => {
	//返回页面
	resp.end(require("fs").readFileSync("./socketIOTest1.html"));
}).listen(9999,"localhost",() => {console.log("listening");}));

//创建一个用于放置用户对象的map
let map = new Map();
//用于记录用户数量的变量,并初始化为0
let userCount = 0;
//遍历map 
let scanMap = func => {
	try{
		map.forEach((value,index,arr) => {
			func(value,index,arr);
		});
	}
	catch(e){
		if(e.message == "break"){
			return;
		}
		else{
			throw e;
		}
	}
}

//通知客户端弹出对话框
let showDialog = (socket,msg) => {
	socket.emit("showDialog",msg);
}

//更新用户列表
let updateList = socket => {
	let userArr = [];
	scanMap((value,index) => {
		if(value != undefined){
			userArr.push(value);
		}
	});
	socket.emit("newUser",userArr);
}

//监听connection 事件
socketServer.on("connection",socket => {
	console.log("有一用户连接");
	//初始化存储当前socket对象
	map.set(socket,"<未命名>");
	//将用户信息写入map
	socket.on("getUser",user => {
		//修改名称
		map.set(socket,user);
		scanMap((value,index) => {
			updateList(index);
		});
	});
	//通知所有客户端更新列表
	scanMap((value,index) => {
		updateList(index);
	});
	//监听客户端来的信息
	socket.on("message",msg => {
		//从客户端接收的消息
		let sender;
		//遍历所有用户
		scanMap((value,index) => {
			if(index == socket){
				sender = value;
			}
		});
		scanMap((value,index) => {
			if(msg.person == "all"){
				index.send(sender + " : " + msg.msg);
			}
			else if(msg.person == value){
				socket.send(sender + " : " +msg.msg);
				index.send(sender + " : " +msg.msg);
				throw new Error("break");
			}
		});
	});
	//监听客户端退出情况
	socket.on("disconnect",() => {
		//用户退出，从map里删除该用户
		map.set(socket,undefined);
		//通知所有用户更新列表
		scanMap((value,index) => {
			updateList(index);
		});
		console.log("有一用户退出连接");
	});
}); 