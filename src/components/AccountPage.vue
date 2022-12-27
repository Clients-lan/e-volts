<template>
    <div>

      <div class="main-panel loading-page" v-if="loading">
        <a-skeleton active :paragraph="{ rows: 4 }" :loading="loading" />
        <br> <br>
        <a-skeleton active :paragraph="{ rows: 4 }" :loading="loading" />
      </div>
        <div v-else class="main-panel">
            <div class="admin-only" v-if="account == 'admin'">
              <form @submit.prevent="addPlace" class="account-tab">
                 <div class="top"><h3>Drop-off / pick-up locations</h3></div>
                  <div class="main-content">
                    <a-input-group compact>
                        <a-input v-model:value="form.location" placeholder="Enter location address" style="width: calc(100% - 110px)" required />
                        <a-button type="primary" htmlType="submit">Save loction</a-button>
                    </a-input-group>

                      <a-list size="small" class="mt-20" bordered :data-source="locations">
                        <template #renderItem="{ item }">
                          <a-list-item>
                            {{ item.location }}
                             <template #actions>
                              <a key="list-loadmore-edit" @click="edit(item)">edit</a>
                              <a key="list-loadmore-more" @click="delDocument('locations', item._id)">Remove</a>
                            </template>
                          </a-list-item>
                        </template>
                        <template #header><div>All locations</div></template>
                      </a-list>
                    </div>
                  </form>
                <div class="account-tab">
                 <div class="top"><h3>Alert messages</h3></div>
                  <form @submit.prevent="addAlerts" class="main-content">
                    <p>Specify what email message is sent to your client when a request or payment status change </p>

                      <div class="ui-form">
                        <label class="ui-label">When a request is created</label>
                        <a-textarea v-model:value="messages.alert_one" placeholder="Enter message" required></a-textarea>
                      </div>

                      <div class="ui-form">
                        <label class="ui-label">When a request is completed</label>
                        <a-textarea v-model:value="messages.alert_two" placeholder="Enter message" required></a-textarea>
                      </div>

                      <div class="ui-form">
                        <label class="ui-label">When a payment is confirmed</label>
                        <a-textarea v-model:value="messages.alert_three" placeholder="Enter message" required></a-textarea>
                      </div>

                      <div class="ui-form">
                        <label class="ui-label">When a request is in progress</label>
                        <a-textarea v-model:value="messages.alert_four" placeholder="Enter message" required></a-textarea>
                      </div>

                      <a-alert message="Type {username} to automatically insert the customer's full name. For example, 'Hi {username}...''" type="info" show-icon>
                        <template #icon><smile-outlined /></template>
                      </a-alert>

                       <a-button type="primary" class="mt-20" htmlType="submit" shape="round" block>Save alert message</a-button>
                    </form>
                </div>
            </div>
            <div v-else class="customer-only">
                <div class="account-tab">
                <div class="top"><h3>Account</h3></div>
                <form @submit.prevent="updateAccount" class="main-content">
                    <div class="grid grid-2">
                      <div class="ui-form">
                        <label class="ui-label">First name</label>
                        <a-input v-model:value="profile.fname"></a-input>
                       </div>
                       <div class="ui-form">
                        <label class="ui-label">Last name</label>
                        <a-input v-model:value="profile.lname"></a-input>
                       </div>
                    </div>
                    <div class="ui-form">
                      <label class="ui-label">Email address</label>
                      <a-input v-model:value="profile.email"></a-input>
                    </div>
                    <div class="ui-form">
                      <label class="ui-label">Company</label>
                      <a-input v-model:value="profile.company"></a-input>
                    </div>
                    <a-button type="primary" shape="round" block>Save changes</a-button>
                </form>
              </div>

               <div class="account-tab">
                <div class="top"><h3>Reset password</h3></div>
                 <div class="main-content">
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis, dolorem.</p>
                    <a-button type="default" shape="round" @click="reset" block>Continue</a-button>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
import { doc, setDoc, getDocs, onSnapshot, collection, query, where } from "firebase/firestore"; 
import {  onAuthStateChanged, updateEmail} from "firebase/auth";

import  { Button, Input, Textarea, Alert, InputGroup, List, ListItem, Skeleton, message } from 'ant-design-vue';
import {  db, auth, manageCookies, delDocument} from '../utils'
import { SmileOutlined } from '@ant-design/icons-vue'
import { generate } from 'short-uuid'


export default {
    components:{
         'a-button': Button, 'a-input': Input, 'a-input-group': InputGroup,
         'a-textarea': Textarea, 'a-alert': Alert, 'a-skeleton': Skeleton,
         'smile-outlined': SmileOutlined, 'a-list': List, 'a-list-item': ListItem
    },
    data: () => ({
        account: null, profile: {},
        currentUser: {}, loadBtn: false, form: {},
        messages: {}, locations: [], loading: true
    }),
    methods:{
        async ready(){
            if(this.account == 'admin') {
              const queryListener = (q) => {
              const qCustomers = query(collection(db, q))

              onSnapshot(qCustomers, (querySnapshot) => {   
                  let qInstance = [] 
                  querySnapshot.forEach((doc) => {
                      qInstance.push(doc.data())
                  });
                  q == 'alerts' ? this.messages = qInstance[0] || {} : this.locations = qInstance
                })
              }
              queryListener('locations')
              return queryListener('alerts')
            }

            const q = query(collection(db, 'customers'), where("_id", "==", this.currentUser.uid))
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => this.profile = doc.data())
        },
        async updateAccount(){
            await setDoc(doc(db, "customers", user.email),  this.profile)
            if(this.profile.email !== this.currentUser.email){
                updateEmail(auth.currentUser, this.profile.email).then(() => {
                   message.success('Email address updated')
                }).catch((error) => {
                  message.error('An error occured!')
                })
            }
        },
        reset(){
            location.href = '/login#reset'
        },
        edit(item){
          this.form = item
        },
        async addPlace(){
          this.form['_id'] = this.form._id || generate()
          await setDoc(doc(db, "locations",  this.form._id),  this.form);
          message.success('Location saved!')
          this.form = {}
        },
        async addAlerts(){
          this.messages['_id'] = this.messages._id || generate()
          await setDoc(doc(db, "alerts",  this.messages._id),  this.messages);
          message.success('Email messages saved!')
        },
        delDocument
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
        if (!user) return location.href = '/login'
            this.currentUser = user 
            this.account = manageCookies(user.email, 'get')
            this.ready()

            setTimeout(() => this.loading = false, 1000);
        })
    }
}
</script>


<style lang="scss" scoped>
@import '../assets/app.scss';


.loading-page{
  max-width: 460px;
  margin: 90px auto;
}
.account-tab{
    max-width: 460px;
    margin: 40px auto;
    background: #fff;
    box-shadow: $box-one;
    border-radius: 10px;

    .top{
        border-bottom: $border;
        padding: 10px 20px;
        h3{
            margin: 0px;
        }
    }
    .main-content{
        padding: 20px;
    }
}
</style>