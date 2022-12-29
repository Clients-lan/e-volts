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
                 <div class="top"><h3>Lieux de dépôt/prise en charge</h3></div>
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
                              <a key="list-loadmore-edit" @click="edit(item)">Éditer</a>
                              <a key="list-loadmore-more" @click="delDocument('locations', item._id)">Supprimer</a>
                            </template>
                          </a-list-item>
                        </template>
                        <template #header><div>Tous les emplacements</div></template>
                      </a-list>
                    </div>
                  </form>
                <div class="account-tab">
                 <div class="top"><h3>Messages d'alerte</h3></div>
                  <form @submit.prevent="addAlerts" class="main-content admin-form">
                    <p>Spécifiez quel message électronique est envoyé à votre client lorsqu'une demande ou un changement de statut de paiement</p>
<!-- 
                      <div class="ui-form">
                        <label class="ui-label">When a request is created</label>
                        <a-textarea v-model:value="messages.alert_one" placeholder="Enter message" :auto-size="{ minRows: 2, maxRows: 5 }" required></a-textarea>
                      </div> -->

                      <div class="ui-form">
                        <label class="ui-label">Lorsque l'entretien est terminé</label>
                        <a-textarea v-model:value="messages.alert_two" placeholder="Enter message" :auto-size="{ minRows: 3, maxRows: 6 }" required></a-textarea>
                      </div>

                      <div class="ui-form">
                        <label class="ui-label">Lorsqu'un paiement est confirmé</label>
                        <a-textarea v-model:value="messages.alert_three" placeholder="Enter message" :auto-size="{ minRows: 3, maxRows: 6 }" required></a-textarea>
                      </div>

                      <div class="ui-form">
                        <label class="ui-label">Lorsque la maintenance est en cours</label>
                        <a-textarea v-model:value="messages.alert_four" placeholder="Enter message" :auto-size="{ minRows: 3, maxRows: 6 }" required></a-textarea>
                      </div>

                      <a-alert message="Type {username} to automatically insert the customer's full name. For example, 'Hi {username}...''" type="info" show-icon>
                        <template #icon><smile-outlined /></template>
                      </a-alert>

                       <a-button type="primary" class="mt-20" htmlType="submit" shape="round" block>Sauvegarder les modifications</a-button>
                    </form>
                </div>
            </div>
            <div v-else class="customer-only">
                <div class="account-tab">
                <div class="top"><h3>Paramètre du compte</h3></div>
                <form @submit.prevent="updateAccount" class="main-content">
                    <div class="grid grid-2">
                      <div class="ui-form">
                        <label class="ui-label">Prénom</label>
                        <a-input v-model:value="profile.fname"></a-input>
                       </div>
                       <div class="ui-form">
                        <label class="ui-label">Nom de famille</label>
                        <a-input v-model:value="profile.lname"></a-input>
                       </div>
                    </div>
                    <div class="ui-form">
                      <label class="ui-label">Adresse e-mail</label>
                      <a-input v-model:value="profile.email"></a-input>
                    </div>
                    <div class="ui-form">
                      <label class="ui-label">Compagnie</label>
                      <a-input v-model:value="profile.company"></a-input>
                    </div>
                    <a-button type="primary" shape="round" block>Sauvegarder les modifications</a-button>
                </form>
              </div>

               <div class="account-tab">
                <div class="top"><h3>Réinitialiser le mot de passe</h3></div>
                 <div class="main-content">
                    <p>Vous voulez réinitialiser votre mot de passe? Cliquez sur le bouton ci-dessous pour initialiser le processus.</p>
                    <a-button type="dashed" shape="round" @click="reset" block>Continuer</a-button>
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
    p{
      color: #777;
   }
   .ui-form{
    margin-bottom: 25px;
   }
}
</style>