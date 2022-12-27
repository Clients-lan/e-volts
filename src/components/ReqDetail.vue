<template>
    <div>
        <div class="main-panel">
          <div class="page-header">
            <a href="/requests/">Retour aux demandes</a>
        </div>
            <div class="request-detail mt-10">
                <div class="top-header" v-if="loading" >
                    <a-skeleton active :paragraph="{ rows: 2 }" :loading="loading" />
                </div>
                <div v-else class="grid grid-2 top-header">
                    <div>
                        <h3>{{ request.name }} ({{ request.plates }})</h3>
                        <p>{{ request.location }}</p>
                    </div>
                    <div class="align-r">
                        <p>Created</p>
                        <p>{{ request.date }}</p>
                    </div>
                </div>
                <div class="middle-header">
                  <a-skeleton v-if="loading" active :paragraph="{ rows: 4 }" :loading="loading" />
                  <div v-else>
                    <p>{{ request.desc }}</p>
                    <div  class="grid grid-3">
                        <div class="ui-form">
                            <label class="ui-lable">Owner</label>
                            <p>{{ owner.fname }} {{ owner.lname }}</p>
                        </div>
                        <div class="ui-form">
                            <label class="ui-label">Urgency</label>
                             <a-select class="ui-select" placeholder="Select" style="width: 100%" v-model:value="request.urgency" :bordered="false" required>
                              <a-select-option v-for="item in sAttrs.urgency" :key="item" :value="item">
                               <a-tag :color="tagMaker(item)">{{ item }}</a-tag>
                              </a-select-option>
                            </a-select>
                        </div>
                        <div class="ui-form">
                         <label class="ui-label">Pick up date</label>
                         <a-date-picker style="width: 100%" v-model:value="dueDate" format="YYYY/MM/DD" />
                      </div>
                      <div class="ui-form">
                        <label class="ui-label">Payment status</label>
                           <a-select class="ui-select" placeholder="Select" @select="watching(request.pay, 'pay')" style="width: 100%" v-model:value="request.pay" :bordered="false" required>
                            <a-select-option v-for="item in sAttrs.pay" :key="item" :value="item">
                           <a-tag :color="tagMaker(item)">{{ item }}</a-tag>
                           </a-select-option>
                         </a-select>
                        </div>
                        <div class="ui-form">
                        <label class="ui-label">Service status</label>
                            <a-select :disabled="admin != 'admin'" class="ui-select" @select="watching(request.status, 'service')" placeholder="Select" style="width: 100%" v-model:value="request.status" :bordered="false" required>
                              <a-select-option v-for="item in sAttrs.status" :key="item" :value="item">
                            <a-tag :color="tagMaker(item)">{{ item }}</a-tag>
                            </a-select-option>
                         </a-select>
                        </div>
                        <div class="ui-form">
                        <label class="ui-label">Location</label>
                         <a-select :disabled="admin != 'admin'" placeholder="Select" style="width: 100%" v-model:value="request.location" required>
                          <a-select-option v-for="(item, index) in locations" :key="index" :value="item.location">{{ truncate(item.location, 28) }}</a-select-option>
                         </a-select>
                       </div>
                    </div>
                    </div>
                </div>
                <div class="bottom-header">
                  <a-popconfirm title="Are you sure delete this request?" ok-text="Yes" cancel-text="No" @confirm="delDocument('requests', request._id)">
                    <a-button type="primary" danger>Delete request</a-button>
                  </a-popconfirm>
                    <a-button type="dashed" @click="saveChanges" class="ml-10">Save changes</a-button>
                </div>
            </div>

            <div class="discussion">
                <a-tabs v-model:activeKey="activeKey">
                <a-tab-pane key="1">
                    <template #tab>
                        <span> <MessageOutlined /> Discussion </span>
                    </template>
                    <div class="chat-tab">
                     <a-skeleton avatar active :paragraph="{ rows: 4 }" :loading="loading" />

                    <div class="chat-tab__main disqus-main">
                      <div v-for="(item, index) in rtchat" :key="index" class="bubble" :class="[item.user == currentUser.uid ? 'chat-me' : 'chat-the']">
                        <div class="flex user-tag">
                         <div class="avatar">
                            <span>{{ item.family == 'admin' ? 'E' : owner.fname.charAt(0).toUpperCase() }}</span>
                         </div>
                         <div>
                          <span>{{ item.family == 'admin'  ? 'E-volts Automobiles' : `${owner.fname} ${owner.lname}` }}</span>
                           <span class="chat-date">@{{ item.date }}</span>
                         </div>
                        </div>
                        <div class="chat-body">
                             <p>{{ item.msg }}</p>
                             <File v-if="item.files && item.files.length > 0" :files="item.files" />
                        </div>
                      </div>
                    </div>
                    <div class="chat-tab__inputs">
                     <form @submit.prevent="postChat">
                        <a-textarea v-model:value="chat.msg" placeholder="Enter message or update" required></a-textarea>
                         <p class="mt-10" v-if="admin == 'admin'"><a-switch size="small" @change="watching(checked, 'post')" v-model:checked="checked"></a-switch>  <span class="inline">Notify {{ owner.fname }} about your new message</span></p>
                        <hr class="mt-10">
                        <div class="grid grid-2">
                            <a-upload :multiple="true" @change="handleChange">
                                <a-button type="link">Add attachments</a-button>
                            </a-upload>
                            <div>
                                <a-button htmlType="submit" class="item-fr" size="large" :loading="wait" type="primary">Send</a-button>
                            </div>
                        </div>
                      </form>
                    </div>
                </div>
                </a-tab-pane>
                <a-tab-pane key="2">
                    <template #tab>
                        <span> <FolderOutlined /> Files </span>
                    </template>
                     <div class="disqus-main discussion-files">
                        <File :files="fileList" />
                    </div>
                </a-tab-pane>
               </a-tabs>
            </div>
        </div>
    </div>
</template>


<script>
import  { Tag, Button, Modal, Select, SelectOption, DatePicker, Input, Textarea, Upload, message, Tabs, TabPane, Switch, Skeleton, Popconfirm } from 'ant-design-vue';
import { saveAttachment, db, auth, tagMaker, sAttrs, manageCookies, chat, getDocuments, mailer, truncate, delDocument } from '../utils'
import { MessageOutlined, FolderOutlined, DownloadOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons-vue'

import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { ref, set, onValue } from "firebase/database";
import { generate } from 'short-uuid'
import dayjs from 'dayjs'

import File from '../components/File.vue'
import emit from '../emit'


export default {
    props: ['par'],
    components:{
        'a-button': Button, 'a-input': Input, 'a-select-option': SelectOption,
        'a-select': Select, 'a-textarea': Textarea, 'a-tabs': Tabs, 'a-popconfirm': Popconfirm,
        'a-date-picker': DatePicker, 'a-tag': Tag, 'a-tab-pane': TabPane,
        'a-switch': Switch, 'a-upload': Upload, 'a-skeleton': Skeleton,
        MessageOutlined, FolderOutlined, DownloadOutlined, DeleteOutlined,
        PaperClipOutlined, File
    },
    data: () => ({
        request: {files: []}, sAttrs, alerts: {},
        form: {}, activeKey: '1', loading: true,
        currentUser: {}, checked: false, chat: {files: []},
        admin: null, rtchat: [], owner: {fname: ''}, watingUploads: [],
        fileList: [], dueDate: null, locations: [], wait: false
    }),
    methods:{
       async ready(family, id){
            let d = await getDocuments(id, family)
            family == 'requests' ? this.request = d[0] : this.owner = d[0]
            if(family == 'requests') this.mountChat()
        },
        handleChange(e){
            this.watingUploads = []
            Promise.all([...e.fileList].map(el => this.watingUploads.push(el.originFileObj)))
        },
        postChat() {
            this.wait = true
            if(this.watingUploads.length > 0) return this.handleUpload()
            let postId = this.chat._id || generate()

            set(ref(chat, 'posts/' + this.request._id + '/msg/' + postId), {
                family: this.chat.family || this.admin,
                msg: this.chat.msg,
                user: this.chat.user || this.currentUser.uid,
                date: this.chat.date || new Date().toLocaleString(),
                files: this.chat.files,
                _id: postId
            });
            this.chat = {files: []}
            this.wait = false
        },
       async mountChat(){
          this.ready('customers', this.request.client_id)
          this.locations = await getDocuments(null, 'locations', true)
          this.alerts = await getDocuments(null, 'alerts', true)

          const starCountRef = ref(chat, 'posts/' + this.request._id);
            onValue(starCountRef, (snapshot) => {
            const data = snapshot.val();

            this.loading = false
            this.fileList = this.request['files'].map(el => Object.assign(el, {origin: true}))
            this.dueDate = dayjs(this.request.due)
            emit.$emit('batch-one', this.fileList)

            if(!data || !data.msg) return
            let foo = []
                            
            for(const el in data.msg){
              foo.push(data.msg[el])
              if(data.msg[el].files)
              this.fileList.push(...data.msg[el].files)
            }
            this.rtchat = foo.sort((a, b) => a.date.localeCompare(b.date))
         })
        },
        handleUpload (){
            Promise.all(this.watingUploads.map(el => saveAttachment(el)))
            .then(firebaseAttrs => {
                firebaseAttrs.forEach(el => this.chat['files'].push(el))
                this.watingUploads = []
                this.postChat()
            })
        },
        async saveChanges(){
            this.request['due'] = dayjs(this.dueDate).format()
            await setDoc(doc(db, "requests", this.request._id),  this.request);
            message.success('Changes updated successfully!')
        },
        watching(val, fam){
          if(fam == 'post'){
            let msg  = `You have an new message from E-volts automobiles. Please <a href="${location.origin}/login">login into your account</a> to view the updates`
            mailer(this.owner.email, 'Post updated', msg)
            return setTimeout(() => this.checked = false, 1000);
          }
          let ald = ['Submitted', 'Confirmed', 'Completed', 'In progress'], al = this.alerts[0]
          if(!ald.includes(val)) return
          let msgTag = val == ald[0] ? al['alert_one'] : val == ald[1] ? al['alert_three'] : val == ald[2] ? al['alert_two'] : al['alert_four']
          msgTag = msgTag.replaceAll('{username}', `${this.owner.fname} ${this.owner.lname}`)

          mailer(this.owner.email, `${fam} updates`, msgTag)
          this.saveChanges()
        },
        //@helpers
        tagMaker, truncate, delDocument
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
        if (!user) return location.href = '/login'
            this.currentUser = user
            this.admin = manageCookies(user.email, 'get')
            this.ready('requests', this.par)
        })

        emit.$on('del-file', (target) => {
          if(target.origin){
            const index = this.fileList.findIndex(file => file.name === target.name);
            this.fileList.splice(index, 1)
            this.request.files = this.fileList.filter(a => a.origin)
            return this.saveChanges()
          }
          const indexParent = this.rtchat.findIndex(chat => chat.files && chat.files.includes(target));
          const indexChild = this.rtchat[indexParent].files.findIndex(file => file.name === target.name)
          this.rtchat[indexParent].files.splice(indexChild, 1)
          this.chat = this.rtchat[indexParent]
          this.postChat()
        })
    },
}
</script>




  
<style lang="scss">
@import '../assets/app.scss';

.ui-select{
    margin-left: -10px;
}

.request-detail, .discussion{
  background-color: #fff;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px 0 rgb(0 0 0 / 6%);
  border-radius: 10px;

  .grid{
    grid-gap: 30px;
    .ui-form{
        margin: 0px;
    }
  }
}

.discussion{
  margin-top: 30px;
  padding: 0 20px 20px 20px;
  .inline{
      display: inline-block;
      transform: translateY(2px);
    }
}

.middle-header{
  border-top: $border;
  border-bottom: $border;
}

.top-header, .middle-header, .bottom-header{
    padding: 20px;
}
.top-header{
    p, h3{
        margin: 0px;
    }
}
.heads{
  display: block;
  margin-top: 20px;
}

.disqus-main{
  min-height: 100px;
}

.chat-me .avatar{
  background-color: #566573;
  color: #fff;
}

.bubble span{
  font-size: .9rem;
  font-weight: 400;
}
.bubble .chat-date{
  color: #777;
  font-weight: 300;
  display: inline-block;
  margin-left: 10px;
  font-size: .8rem;
}


.bubble{
  margin-bottom: 20px;
  p{
    font-size: .9rem;
    color: #333;
    margin-top: 0px;
 }
}

.chat-body{
  margin-left: 35px;
  p{
    margin: 0px;
  }
}


@media (max-width:900px) {
  .middle-header{
    .grid{
      grid-template-columns: 100% !important;
    }
  }
}







</style>