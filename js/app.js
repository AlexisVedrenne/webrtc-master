
var socket;
var coolPhone;
offre="";
let p=null;
var remoteAudio = new window.Audio()
remoteAudio.autoplay = true;

const mediaSource = new MediaSource();
var selfView = document.getElementById('emitter');
var remoteView = document.getElementById('recevier');
var session;


 function connexion(id,mdp){
    socket = new JsSIP.WebSocketInterface('wss://tel3.portierdiese.com');
    socket.via_transport = "tcp";
    var configuration = {
    sockets  : [ socket ],
    uri      : id+'@tel3.portierdiese.com:5060',
    password : mdp
    };

    coolPhone = new JsSIP.UA(configuration);

    coolPhone.on('connected', function(){ 
        document.getElementById('hEtat').innerText="Utilisateur en ligne";
    });

    coolPhone.on('disconnected', function(){ 
        document.getElementById('hEtat').innerText="Utilisateur hors ligne";
    });

    coolPhone.on('registered', function(){ 
        document.getElementById('hReg').innerText="Enregistrer";
    });
    coolPhone.on('unregistered', function(e){
        document.getElementById('hReg').innerText="Pas enregistrer";
    });
    coolPhone.on('registrationFailed', function(e){ 
        document.getElementById('hReg').innerText="Echec enregistrement";
    });

    coolPhone.on('newMessage', function(e){ 

        if(e.originator=='remote'){
            
            if(e.message._request.body!="ok"){
                offre+=JSON.stringify(e.message._request.body);
            }
            else{
                startPeer(false,500);
                if(p==null){
                    p =new SimplePeer({
                        initiator:false,
                        trickle:false,
                        config: { iceServers: [{     	url: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com' }, { urls: 'stun:stun.l.google.com:19302' }] }
                    })
                    bindEvent(p,500);
                }
                offre=offre.replace('\"type"',' ');
                offre+=offre.trim();
                console.log(offre);
                p.signal(JSON.parse(offre));
            }   
        }
    });

    coolPhone.on('newRTCSession', function(ev){ 
        var newSession = ev.session;
        if(session){ // hangup any existing call
            session.terminate();
        }
        session = newSession;
        var completeSession = function(){
                        session = null;
        };


        if(session.direction === 'outgoing'){
                console.log('stream outgoing  -------->');               
        session.on('connecting', function() {
            console.log('CONNECT'); 
                        });
        session.on('peerconnection', function(e) {
            console.log('1accepted');
                        });
        session.on('ended', function(e){
            console.log(e);
        });
        session.on('failed', function(e){
            console.log(e);
        });
        session.on('accepted',function(e) {
            console.log('accepted')
                        });
        session.on('confirmed',function(e){
            console.log('CONFIRM STREAM');
                        });

                };

        if(session.direction === 'incoming'){
            console.log('stream incoming  -------->');               
        session.on('connecting', function() {
            console.log('CONNECT'); 
                        });
        session.on('peerconnection', function(e) {
            console.log('1accepted');
            add_stream(); 
                        });
        session.on('ended', completeSession);
        session.on('failed', completeSession);
        session.on('accepted',function(e) {
            console.log('accepted')
                        });
        session.on('confirmed',function(e){
            console.log('CONFIRM STREAM');
                        });

                var options = {
        'mediaConstraints' : { 'audio': true, 'video': true },
        'pcConfig': {
          'rtcpMuxPolicy': 'require',
          'iceServers': [
                                                ]
                                        },
                                };
            console.log('Incoming Call');
            session.answer(options);
           }        
          
     });

    coolPhone.start();
 }

 function callAsterisk(numTels) {
    var options = {
            'mediaConstraints' : { 'audio': true, 'video': true },
            'pcConfig': {
              'rtcpMuxPolicy': 'require',
              'iceServers': [
              ]
            },
          };
    
        var numTel = numTels.toString();
        var num = '200';
        console.log(numTel);
        coolPhone.call(numTel, options)
        add_stream();
    };

 function add_stream(){
    session.connection.addEventListener('addstream',function(e) {
    remoteAudio.srcObject = (e.stream);
    remoteView.srcObject = (e.stream);
    selfView.srcObject = (session.connection.getLocalStreams()[0]);
})
}

 document.getElementById("btnConnexion").addEventListener('click',function(){
     id= document.getElementById('txtId')
     mdp= document.getElementById('txtMdp')
     id.setAttribute('readonly','true');
     mdp.setAttribute('readonly','true');
     this.setAttribute("disabled",'true');
    connexion(id.value,mdp.value);
     
 })




 document.getElementById("btnContact").addEventListener('click',function(){
      
     callAsterisk(document.getElementById("inNumber").value);
 })


 document.getElementById("btnChat").addEventListener('click',function(){
    coolPhone.sendMessage('sip:501', document.getElementById('txtChat').value);
 })

 //Connexion au peerTopeer


 function bindEvent(p,id){

    p.on('error',function(err){
        console.log(err);
    })

    p.on('signal',function(data){
        data=JSON.stringify(data);
        cutTransfere(data,id);
        //coolPhone.sendMessage('sip:'+id,data);
    })

    p.on('stream',function(stream){
        let recevier= document.getElementById("recevier");
        recevier.srcObject=stream;
        recevier.play();
    })
//     document.getElementById("incoming").addEventListener('submit',function(e){
//     e.preventDefault();
//     if(p==null){
//             p =new SimplePeer({
//             initiator:false,
//             trickle:false,
//             config: { iceServers: [{     	url: 'turn:numb.viagenie.ca',
//             credential: 'muazkh',
//             username: 'webrtc@live.com' }, { urls: 'stun:stun.l.google.com:19302' }] }
//         })
//         bindEvent(p);
//     }


        //p.signal(JSON.parse(document.getElementById("textIn").value));
// })
}
  

function startPeer(initiateur,id){
	
	    navigator.mediaDevices.getUserMedia({
        video:true,
        audio:true
    }).then(function(stream){
        p = new SimplePeer({initiator:initiateur,stream:stream,trickle:false,config: { iceServers: [{      	url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com' }, { urls: 'stun:stun.l.google.com:19302' }] }})
        bindEvent(p,id);
        let emitter= document.getElementById("emitter");
        emitter.srcObject=stream;
        emitter.play();
    })
    
}

function cutTransfere(data,id){
    max=data.length;
    nb=max/850;
    debut=0;
    console.log(data);
    //console.log(data.substr(0,1200));
    for(i=0;i<nb;i++){
        coolPhone.sendMessage('sip:'+id,data.substr(debut,850));
        debut+=850;
    }
    coolPhone.sendMessage('sip:'+id,"ok");
}


 