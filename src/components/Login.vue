<template>
    <div>
        <div class="main-panel">
            <div class="auth-logo center">
                <img src="../assets/logo.svg">
            </div>

            <form @submit.prevent="login" class="auth">
                <h2 class="center">S'identifier</h2>
                <div class="ui-form">
                    <a-input size="large" v-model:value="form.email" placeholder="Adresse e-mail" type="email" required>
                        <template #prefix><UserOutlined style="color: rgba(0, 0, 0, 0.25)" /></template>
                    </a-input>
                </div>
                <div class="ui-form">
                    <a-input size="large" type="password" v-model:value="form.password" placeholder="Mot de passe" required>
                        <template #prefix><LockOutlined style="color: rgba(0, 0, 0, 0.25)" /></template>
                    </a-input>
                </div>

                <a-button type="primary" htmlType="submit" class="mt-20" :loading="loading" size="large" block>Procéder</a-button>
                <div class="cente mt-10">
                    <a href="#reset" @click="visible = true">Mot de passe oublié?</a>
                </div>

            </form>
        </div>

        <a-modal v-model:visible="visible" title="Reset your password" :onCancel="close" :footer="null">
            <form @submit.prevent="reset">
                <div class="ui-form">
                    <label class="ui-label">Your email</label>
                    <a-input v-model:value="resetForm" type="email" placeholder="Enter email address" required />
                </div>
                <a-button htmlType="submit" type="primary" :loading="loading" block>Request reset link</a-button>
            </form>
        </a-modal>

    </div>
</template>




<script>
import { Input, Button, Modal, message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { auth, manageCookies, loginErr } from '../utils'

export default {
    components:{
        'a-input': Input, UserOutlined, LockOutlined,
        'a-button': Button, 'a-modal': Modal
    },
    data: () => ({
        form: {}, loading: false,
        visible: false, resetForm: null
    }),
    methods:{
        login(){
            this.loading = true
            signInWithEmailAndPassword(auth, this.form.email, this.form.password).then(userCredential => {
                const user = userCredential.user;
                manageCookies(user.email, 'set')
            }).catch((error) => {
                const err = loginErr(error.message)
                message.error(err);
                this.loading = false
            })
        },
        reset(){
            this.loading = true
            sendPasswordResetEmail(auth, this.resetForm)
            .then(() => {
               message.success('Reset password set')
               this.close()
            })
            .catch((error) => {
                const err = loginErr(error.message)
                message.error(err);
                this.loading = false
            })
        },
        close(){
            history.pushState(null, document.title, location.pathname + location.search)
            this.visible = false
            this.loading = false
        }
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
            if(user && location.hash !== '#reset'){
              location.href = 'requests'
            }
        })
        if(location.hash == '#reset'){
            this.visible = true
        }
    }
}
</script>


<style lang="scss" scoped>
@import '../assets/app.scss';

.auth-logo{
    max-width: 300px;
    margin: 0 auto;
    img{
        width: 100%;
    }
}
.auth{
    background-color: #fff;
    box-shadow: $box-one;
    padding: 30px;
    max-width: 380px;
    margin: 50px auto;
    border-radius: 10px;
}

.ui-form{
    margin-top: 20px;
}


</style>