import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyAr2WD_WZydtVfl96CVXj0xzPhzf6UB9MI",
  authDomain: "online-chat-536f1.firebaseapp.com",
  databaseURL: "https://online-chat-536f1-default-rtdb.firebaseio.com",
  projectId: "online-chat-536f1",
  storageBucket: "online-chat-536f1.firebasestorage.app",
  messagingSenderId: "898340850426",
  appId: "1:898340850426:web:c92bc391593b4624e61743",
  measurementId: "G-7TFSRM2WB4"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// ================= STATE =================
let currentUser=null, channel="general", dmUser=null;
let userColors={}, onlineUsers={}, channels=[], messageTimestamps=[];
let lastSpamTime=0;

// ================= ELEMENTS =================
const loginDiv=document.getElementById("login");
const chatDiv=document.getElementById("chat");
const chatHeader=document.getElementById("chatHeader");
const msgInput=document.getElementById("msg");
const mentionList=document.getElementById("mentionList");
const pingSound=document.getElementById("pingSound");
const spamPopup=document.getElementById("spamPopup");
const spamBarFill=document.getElementById("spamBarFill");
const spamOkBtn=document.getElementById("spamOkBtn");
const timeoutBar=document.getElementById("timeoutBar");
const channelListDiv=document.getElementById("channelList");
const addChannelDiv=document.getElementById("addChannelDiv");

// ================= UTILITY =================
function randomColor(){ return "#"+Math.floor(Math.random()*0xAAAAAA+0x222222).toString(16); }
function sendAdminAction(action){ const div=document.createElement("div"); div.className="message system"; div.innerHTML=`<span class="username" style="color:red">@ ADMIN</span> HAS ${action}`; chatDiv.appendChild(div); chatDiv.scrollTop=chatDiv.scrollHeight; }
function now(){ return Date.now(); }

// ================= LOGIN/GUEST =================
function showLogin(){
  loginDiv.innerHTML=`
    <input id="email" placeholder="Email">
    <input id="password" type="password" placeholder="Password">
    <button id="loginBtn">Login</button>
    <button id="registerBtn">Register</button><hr>
    <button id="guestBtn">Continue as Guest</button>
    <small style="color:#aaa;">Hint: You can chat without logging in as a Guest</small>
  `;
  document.getElementById("loginBtn").onclick=login;
  document.getElementById("registerBtn").onclick=register;
  document.getElementById("guestBtn").onclick=guestLogin;
}

async function register(){
  const email=document.getElementById("email").value;
  const password=document.getElementById("password").value;
  try{
    const userCred=await createUserWithEmailAndPassword(auth,email,password);
    const color=randomColor();
    userColors[userCred.user.uid]=color;
    await set(ref(db,'users/'+userCred.user.uid),{
      email, color,
      admin:(email==="ethanq.au@gmail.com" || email==="bananaeatergod@outlook.com")
    });
    alert("Account created! Login now.");
  }catch(e){alert(e.message);}
}

async function login(){
  const email=document.getElementById("email").value;
  const password=document.getElementById("password").value;
  try{ await signInWithEmailAndPassword(auth,email,password); }
  catch(e){alert(e.message);}
}

function guestLogin(){
  const guestName="Guest_"+Math.floor(Math.random()*9000+1000);
  const guestColor=randomColor();
  currentUser={uid:"guest_"+now(),email:guestName,guest:true};
  userColors[currentUser.uid]=guestColor;
  loginDiv.innerHTML=`Logged in as ${guestName} (Guest)`;
  goOnline(); fetchChannels(); renderUsers(); fetchMessages();
}

// ================= AUTH STATE =================
onAuthStateChanged(auth,user=>{
  if(user){
    currentUser=user;
    const userRef = ref(db,'users/'+user.uid);
    get(userRef).then(snap=>{
      const info = snap.val() || {};
      if(!info.color){ const color=randomColor(); userColors[user.uid]=color; set(userRef+'/color', color); } 
      else userColors[user.uid]=info.color;
      if(user.email==="ethanq.au@gmail.com" || user.email==="bananaeatergod@outlook.com"){
        if(!info.admin) set(userRef+'/admin',true);
      }
    });
    loginDiv.innerHTML=`Logged in as ${user.email}`;
    goOnline(); fetchChannels(); renderUsers(); fetchMessages();
  } else if(!currentUser?.guest) currentUser=null;
});

// ================== REMAINING FEATURES =================
// (Users sidebar, channels, chat, DMs, mentions, admin commands, timeout bar, anti-spam)
// You can continue adding the rest of JS from the previous app.js snippet
