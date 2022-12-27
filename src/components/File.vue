<template>
    <div>
        <div class="attachments flex" v-for="(item, index) in files" :key="index">
            <div class="width-2 flex">
                <span class="material-symbols-outlined">
                    <PaperClipOutlined />
                </span>
                <span class="ml-10">{{ item.name }}</span>
            </div>
            <div class="file-actions">
                <a-button type="dashed" size="small" @click="open(item.url)" shape="circle">
                    <template #icon><DownloadOutlined /></template>
                </a-button>
                <a-popconfirm title="Are you sure delete this file?" ok-text="Yes" cancel-text="No" @confirm="delFile(item)">
                 <a-button type="dashed"  class="ml-10" size="small" shape="circle">
                    <template #icon><DeleteOutlined /></template>
                 </a-button>
                </a-popconfirm>
            </div>
        </div>
    </div>
</template>

<script>
import  { Button, Popconfirm, message } from 'ant-design-vue';
import { DownloadOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons-vue'
import { ref, deleteObject } from "firebase/storage";
import { storage } from '../utils'
import emit from '../emit'



export default {
    props: ['files'],
    components: {
        'a-button': Button, DeleteOutlined, DownloadOutlined,
        PaperClipOutlined, 'a-popconfirm': Popconfirm
    },
    methods:{
        open(url){
            window.open(url, '_blank')
        },
        delFile(item){
            const desertRef = ref(storage, `attachments/${item.name}`);
            deleteObject(desertRef).then(() => {
                emit.$emit('del-file', item)
            }).catch((error) => {
                message.error(`Something is not right ${error}`)
            })
        },
    },
}
</script>


<style lang="scss" scoped>
@import '../assets/app.scss';

.attachments{
  padding: 5px 0;
  .width-2{
    border: $border;
    border-radius: 10px;
    margin: -1px 10px 0 0;
    padding: 5px;
    .material-symbols-outlined{
      transform: rotate(-45deg);
    }
    @media (max-width:800px) {
        width: 75%;
        .material-symbols-outlined{
            transform: none;
          }
        span{
            font-size: .7rem;
            &.ml-10{
                margin-left: 5px;
            }
        }
    }
  }
}

</style>