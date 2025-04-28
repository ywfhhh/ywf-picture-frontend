<template>
  <div id="userManagePage">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="账号">
        <a-input v-model:value="searchParams.userAccount" placeholder="输入账号" allow-clear />
      </a-form-item>
      <a-form-item label="用户名">
        <a-input v-model:value="searchParams.userName" placeholder="输入用户名" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <div style="margin-bottom: 16px" />
    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'userAvatar'">
          <a-image :src="record.userAvatar" :width="120" />
        </template>
        <template v-else-if="column.dataIndex === 'userRole'">
          <div v-if="record.userRole === 'admin'">
            <a-tag color="green">管理员</a-tag>
          </div>
          <div v-else-if="record.userRole === 'user'">
            <a-tag color="blue">普通用户</a-tag>
          </div>
          <div v-else-if="record.userRole === 'guest'">
            <a-tag color="gray">访客</a-tag>
          </div>
        </template>
        <template v-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <!-- 用 Space 把两个按钮间隔开 -->
          <a-space size="middle">
            <a-button type="primary" @click="doUpdate(record)">更新</a-button>
            <a-button danger @click="doDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
  <!-- 更新用的 Modal + Form -->
  <a-modal
    v-model:open="modalVisible"
    title="更新用户信息"
    @ok="onSubmit"
    @cancel="closeModal"
    :confirm-loading="updating"
  >
    <a-form
      ref="editForm"
      :model="form"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 16 }"
      @finish="onSubmit"
    >
      <a-form-item label="账号" name="userAccount">
        <a-input v-model:value="form.userAccount" placeholder="请输入账号" />
      </a-form-item>

      <a-form-item label="用户名" name="userName">
        <a-input v-model:value="form.userName" placeholder="请输入用户名" />
      </a-form-item>

      <a-form-item label="用户角色" name="userRole">
        <a-select
          v-model:value="form.userRole"
          placeholder="请选择角色"
          :options="roleOptions"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  deleteUserUsingPost,
  listUserVoByPageUsingPost,
  userUpdateUsingPost,
} from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const modalVisible = ref(false)
const updating = ref(false)
// 3. 你的数据模型
// 表单数据
const form = reactive<API.UserVO>({
  userAccount: '',
  userName: '',
  userRole: [],
} as API.UserVO)

// 校验规则
const rules = {
  userAccount: [{ required: false, message: '账号名', trigger: 'blur' }],
  userName: [{ required: false, message: '用户名', trigger: 'blur' }],
  userRole: [{ required: true, message: '请选择用户角色', trigger: 'change' }],
}
// 角色列表选项
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' },
  { label: '访客', value: 'guest' },
]

// a-form 组件实例
const editForm = ref<any>(null)

// 打开编辑对话框
function doUpdate(record: API.UserVO) {
  Object.assign(form, record) // 取消注释此行
  modalVisible.value = true
}

// onSubmit 里通过 editForm.value.validate() 去验证
async function onSubmit() {
  if (!editForm.value) return
  // 7. 先校验
  const valid = await editForm.value.validate().catch(() => false)
  if (!valid) return

  updating.value = true
  try {
    const res = await userUpdateUsingPost(form)
    if (res.data.code === 0) {
      message.success('更新成功')
      closeModal()
      fetchData()
    } else {
      message.error('更新失败：' + res.data.message)
    }
  } catch (e) {
    message.error('保存失败')
  } finally {
    updating.value = false
  }
}

// 关闭对话框并重置表单
function closeModal() {
  modalVisible.value = false
  setTimeout(() => editForm.value?.resetFields(), 300)
}

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
  },
  {
    title: '用户名',
    dataIndex: 'userName',
  },
  {
    title: '头像',
    dataIndex: 'userAvatar',
  },
  {
    title: '简介',
    dataIndex: 'userProfile',
  },
  {
    title: '用户角色',
    dataIndex: 'userRole',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

// 定义数据
const dataList = ref<API.UserVO[]>([])
const total = ref(0)

// 搜索条件
const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'ascend',
})

// 获取数据
const fetchData = async () => {
  const res = await listUserVoByPageUsingPost({
    ...searchParams,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

// 页面加载时获取数据，请求一次
onMounted(() => {
  fetchData()
})

// 分页参数
const pagination = computed(() => {
  return {
    current: searchParams.current,
    pageSize: searchParams.pageSize,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
  }
})

// 表格变化之后，重新获取数据
const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

// 搜索数据
const doSearch = () => {
  // 重置页码
  searchParams.current = 1
  fetchData()
}

// 删除数据
const doDelete = async (record: API.UserVO) => {
  id = record.id
  if (!id) {
    return
  }
  const res = await deleteUserUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}
</script>
