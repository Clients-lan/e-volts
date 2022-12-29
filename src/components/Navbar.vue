<template>
    <div>
        <header>
            <nav>
             <div class="nav-wrapper grid">
                <div class="left-nav">
                    <div class="logo"><img src="../assets/logo.svg" alt="logo"></div>
                </div>
                <div class="nav-links flex">
                        <a href="/home" :class="[path == 'home' ? 'active' : '']"><dashboard-outlined /> <span class="nav-text">Aperçu</span></a>
                        <a href="/requests" :class="[pathAlt.startsWith('requests') ? 'active' : '']"><tag-outlined /> <span class="nav-text">Demandes</span> </a>
                        <a v-if="user == 'admin'" href="/customers" :class="[path == 'customers' ? 'active' : '']"><team-outlined /> <span class="nav-text">Clients</span></a>
                        <a href="/account" :class="[path == 'account' ? 'active' : '']"><setting-outlined /> <span class="nav-text">Réglages</span></a>
                    </div>
                <div class="right-nav">
                    <a-dropdown-button :trigger="['click']"> Log out
                     <template #overlay>
                      <a-menu @click="handleMenuClick"> <a-menu-item key="1"> Se déconnecter</a-menu-item>  </a-menu>
                      </template>
                     <template #icon><LogoutOutlined /></template>
                    </a-dropdown-button>
                </div>
             </div>
            </nav>
        </header>
    </div>
</template>

<script>
import { Button, MenuItem, Menu, DropdownButton } from 'ant-design-vue'
import { LogoutOutlined, SettingOutlined, TeamOutlined, CarOutlined, DashboardOutlined, TagOutlined } from '@ant-design/icons-vue'
import { signOut } from "firebase/auth";
import { auth } from '../utils'

export default {
    props: ['user', 'path'],
    components:{
        'a-button': Button, 'dashboard-outlined': DashboardOutlined, LogoutOutlined,
        'a-dropdown-button': DropdownButton,  'a-menu': Menu,
        'a-menu-item': MenuItem, 'team-outlined': TeamOutlined,
        'setting-outlined': SettingOutlined, 'tag-outlined': TagOutlined
    },
    data: () => ({
        pathAlt: ''
    }),
    methods:{
        handleMenuClick(){
            signOut(auth)
        }
    },
    created(){
        this.pathAlt = this.path
    },
}
</script>


<style lang="scss" scoped>

nav{
    position: fixed;
    top: 0; 
    width: 100%;
    z-index: 8;
    background: #f4f5f7;
    padding: 10px 10px 0 10px;
    .nav-wrapper{
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
        padding: 10px;
        border-radius: 10px;
        display: grid;
        background: #fff;
        grid-template-columns: 30% 50% 20%;
    }
    img{
        width:260px;
    }

    .nav-links{
        a{
            color: #676b5f;
            padding: 5px 12px;
            margin: 0 10px;
            border-radius: 10px;
            span{
                font-size: 1.2rem;
                transform: translateY(1px);
            }
            .nav-text{
                font-size: 1rem;
            }
            &:hover, &.active{
                background: #f3f3f1;
            }
        }
    }

    .right-nav{
        padding-top: 2px;
    }

    @media (max-width: 900px) {
        .logo{display: none;}
        .nav-wrapper{
            grid-template-columns: 0% 65% 35%;
            .nav-links{
                margin-left: -15px;
               a{
                margin: 0 5px;
                span{
                    font-size: 1.3rem;
                }
                .nav-text{
                    display: none;
                }
               }
            }
        }
    }

}
</style>