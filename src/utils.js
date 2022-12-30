// @ts-nocheck

import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, getDocs, query, collection, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { message } from 'ant-design-vue'


const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_KEY,
    authDomain: "lab-ch3.firebaseapp.com",
    databaseURL: "https://lab-ch3-default-rtdb.firebaseio.com",
    projectId: "lab-ch3",
    storageBucket: "lab-ch3.appspot.com",
    messagingSenderId: "137355579041",
    appId: "1:137355579041:web:dbe91097d8e860fc1d2ae0",
    measurementId: "G-QZV2F0M5FG"
  };


  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const storage = getStorage(app);
  const auth = getAuth(app);
  const chat = getDatabase(app);




  // @ts-ignore
  function setCookie(name,value,days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

 // @ts-ignore
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}


  // @ts-ignore
  const manageCookies = (email, genre) => {
    if(genre == 'get') return getCookie('evolt-user')
  
    if(email === import.meta.env.PUBLIC_ADMIN_EMAIL){
      setCookie('evolt-user', 'admin')
    }else{
      setCookie('evolt-user', 'customer')
    }
  }


  const saveAttachment = async (file) => {
      let name = `${(Math.random() + 1).toString(36).substring(7)}-${file.name}` 

      const storageRef = ref(storage, `attachments/${name}`);
      const uploader = await uploadBytes(storageRef, file)
      const download = await getDownloadURL(storageRef)  
     return {
        name: name, url: download
     }
  }



  const findCustomer = (id, array) => {
    let cus =  array.filter(attr => attr._id == id)
    return cus.length > 0 ? `${cus[0].fname} ${cus[0].lname}` : 'N/A'
  }

  const sAttrs = {
    status: [
      'Soumis', 'En cours', 'En attente', 'Complété',
    ],
    urgency: ['Faible', 'Moyen', 'Haut'],
    pay: ['Rédigé', 'Traitement', 'Payé', 'Confirmé'],
    formAttr: {files: [], due: null, date: new Date().toLocaleDateString('fr-FR'), status: 'Soumis', pay: 'Rédigé'},
  }


  const reqColumns = [
    { title: 'Req. #', dataIndex: 'orderid', responsive: ['sm'] },
    {
      title: 'Modèle', dataIndex: 'name',
      sorter: (a, b) => a.name.length - b.name.length,
      sortDirections: ['descend', 'ascend'],
    },
    {
       title: 'Statut', dataIndex: 'status',
       sorter: (a, b) => a.status.length - b.status.length,
     },
    { title: 'Immatricul.', dataIndex: 'plates' },
    { 
      title: 'Urgency', dataIndex: 'urgency',  responsive: ['sm'],
      sorter: (a, b) => a.urgency.length - b.urgency.length,
      filters: sAttrs.urgency.map(el => { return { text: el, value: el }}),
      onFilter: (value, record) => record.urgency.indexOf(value) === 0,
     },
    { title: 'Établi', dataIndex: 'date', width: '12%', responsive: ['sm'] },
    { title: 'O', key: 'operation', dataIndex: '_id', width: '10px' },
  ];

  const cusColumns = [
    { title: 'Prénom', dataIndex: 'fname', responsive: ['sm'] },
    { title: 'Nom de famille', dataIndex: 'lname', responsive: ['sm'] },
    {
       title: 'E-mail', dataIndex: 'email',
       sorter: (a, b) => a.email.length - b.email.length,
     },
    { title: 'Compagnie', dataIndex: 'company' },
    { title: 'Date', dataIndex: 'date', responsive: ['sm'] },
    { title: null, key: 'operation', dataIndex: '_id', width: '30px' },
  ]

  const tagMaker = (w) => {
    let gray  = [sAttrs.pay[0], sAttrs.status[0], sAttrs.urgency[0]]
    let blue = [sAttrs.urgency[1], sAttrs.pay[1], sAttrs.status[1]]
    let orange = [sAttrs.status[2]]
    let red = [sAttrs.urgency[2]]

    return gray.includes(w) ? 'default' : blue.includes(w) ? 'blue' :
    orange.includes(w) ? 'orange' : red.includes(w) ? 'red' : 'green'
  }        


  const loginErr = (err) => {
    let msg = err.includes('wrong-password') ? 'Incorrent password' : err.includes('user-not-found') ? 'This email is not reqistered' :
    err.includes('email-already') ? 'That email address is already registered to a customer' : 'Temporary error! Please try again later'
    return msg
  }
 
  const mailer = (to, sub, msg) => {
    fetch(`/api/mailing`, {
      method: 'POST',
      body: JSON.stringify({
        to: to || import.meta.env.PUBLIC_ADMIN_EMAIL, 
        subject: sub, msg: msg
      })
    }).then(res => res.json())
    .then(res => {
      message.success(res.msg)
    }).catch((err) => {
        message.error(`Something is not right... ${err}`)              
    })
  }

  const delDocument = async (family, id) => {
    await deleteDoc(doc(db, family, id));
    message.success(`Item successfully deleted from ${family} `)
    if(family == 'requests') return setTimeout(() => location.href = '/requests', 600);
  }
  

  const getDocuments = async (uid, family, dir) => {
    let results = []

    const q = dir ? query(collection(db, family)) :  query(collection(db, family), where("_id", "==", uid))
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => results.push(doc.data()))
    return results
  }

  const singleCustomerAutos = async (uid) => {
    const q =  query(collection(db, 'requests'), where("client_id", "==", uid))
    const querySnapshot = await getDocs(q);
    return querySnapshot
  }

  const truncate = (str, n) => (str.length > n) ? str.slice(0, n-1) + '...' : str;
  const sea = (i, sh) => i.toLowerCase().match(sh.toLowerCase())


  export {
    db, manageCookies, saveAttachment, auth, sea,
    findCustomer, sAttrs, reqColumns, tagMaker,
    chat, cusColumns, loginErr, mailer, delDocument,
    getDocuments, truncate, storage, getCookie, singleCustomerAutos
  }