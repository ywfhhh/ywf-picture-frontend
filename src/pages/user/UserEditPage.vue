<template>
  <div id="userEditPage">
    <h2 class="title">智能云图库 - 个人设置</h2>
    <div class="desc">企业级智能协同云图库</div>
    <a-form
      ref="editForm"
      :model="formEdit"
      name="basic"
      autocomplete="off"
      @finish="handleSubmit"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 14 }"
    >
      <!-- id（只读） -->
      <a-form-item label="用户id" name="id">
        <a-input v-model:value="formEdit.id" readonly />
      </a-form-item>
      <!-- 账号名（只读） -->
      <a-form-item label="账号名" name="userAccount">
        <a-input v-model:value="formEdit.userAccount" readonly />
      </a-form-item>

      <!-- 用户名 -->
      <a-form-item
        label="用户名"
        name="userName"
        :rules="[{ required: true, message: '用户名不能为空' }]"
      >
        <a-input v-model:value="formEdit.userName" placeholder="请输入用户名" />
      </a-form-item>

      <!-- 个人简介 -->
      <a-form-item
        label="个人简介"
        name="userProfile"
        :rules="[{ max: 200, message: '最多 200 字', whitespace: true }]"
      >
        <a-textarea
          v-model:value="formEdit.userProfile"
          rows="4"
          placeholder="这个人很懒，什么都没留下"
        />
      </a-form-item>

      <!-- 用户头像 -->
      <a-form-item label="用户头像">
        <div class="avatar-upload-wrapper">
          <!-- 头像预览（只有有 URL 时显示） -->
          <img
            v-if="formEdit.userAvatar"
            :src="formEdit.userAvatar"
            class="avatar-preview"
            alt="avatar"
            width="200"
            height="150"
          />

          <!-- 上传控件 -->
          <a-upload
            list-type="picture-card"
            :show-upload-list="false"
            :custom-request="handleUpload"
            :before-upload="beforeUpload"
          >
            <div class="upload-placeholder">
              <div class="ant-upload-text">点击或拖拽上传</div>
            </div>
          </a-upload>
        </div>
      </a-form-item>

      <!-- 提交按钮 -->
      <a-form-item :wrapper-col="{ offset: 6, span: 14 }">
        <a-button type="primary" html-type="submit" :loading="updating">保存</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { message } from 'ant-design-vue'
import { userUpdateAvatarUsingPost, userUpdateUsingPost } from '@/api/userController'
import { useRouter } from 'vue-router'

const loginUserStore = useLoginUserStore()
const formEdit = reactive<API.UserVO>({
  id: loginUserStore.loginUser.id,
  userAccount: loginUserStore.loginUser.userAccount,
  userName: loginUserStore.loginUser.userName,
  userProfile: loginUserStore.loginUser.userProfile || '',
  userAvatar: loginUserStore.loginUser.userAvatar || { url: '' },
})
const router = useRouter()
const editForm = ref<any>(null)
const updating = ref(false)
const loading = ref(false)

// 上传前检查
const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片！')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！')
  }
  return isJpgOrPng && isLt2M
}

// 上传头像
const handleUpload = async ({ file }: { file: File }) => {
  loading.value = true
  try {
    const res = await userUpdateAvatarUsingPost({}, file)
    if (res.data.code === 0 && res.data.data) {
      message.success('头像修改成功')
      formEdit.userAvatar = res.data.data
    } else {
      message.error('头像修改失败，' + res.data.message)
    }
  } catch (error: any) {
    console.error('头像修改失败', error)
    message.error('头像修改失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!editForm.value) return

  const valid = await editForm.value.validate().catch(() => false)
  if (!valid) return

  updating.value = true
  try {
    console.log(formEdit)
    const res = await userUpdateUsingPost(formEdit)
    console.log(res)
    if (res.data.code === 0) {
      message.success('更新成功')
      // 跳转到主页
      await loginUserStore.fetchLoginUser()
      router.push({
        path: `/`,
      })
    } else {
      message.error('更新失败：' + res.data.message)
    }
  } catch (e) {
    message.error('保存失败')
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
#userEditPage {
  max-width: 500px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: bold;
}

.desc {
  text-align: center;
  margin-bottom: 24px;
  color: #888;
}

.avatar {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ant-upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>
