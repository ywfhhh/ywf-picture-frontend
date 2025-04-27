<template>
  <div id="tagManagePage">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="标签名">
        <a-input v-model:value="searchParams.tagName" placeholder="输入标签名" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <!--    <a-button type="primary" @click="doAdd(record)">新增</a-button>-->
    <div style="margin-bottom: 16px" />
    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'tagName'">
          {{ record.tagName }}
        </template>
        <template v-if="column.dataIndex === 'userName'">
          {{ record.userName }}
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
    v-model:open="updateModalVisible"
    title="更新标签信息"
    @ok="onSubmitUpdate"
    @cancel="closeUpdateModal"
    :confirm-loading="updating"
  >
    <a-form
      ref="updateFormNode"
      :model="updateForm"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 16 }"
      @finish="onSubmitUpdate"
    >
      <a-form-item label="Id" name="id">
        <a-input :value="updateForm.id" readonly />
      </a-form-item>
      <a-form-item label="标签名" name="tagName">
        <a-input v-model:value="updateForm.tagName" placeholder="请输入标签名" />
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 新增用的 Modal + Form -->
  <a-modal
    v-model:open="addModalVisible"
    title="新增标签信息"
    @ok="onSubmitAdd"
    @cancel="closeAddModal"
    :confirm-loading="adding"
  >
    <a-form
      ref="addFormNode"
      :model="addForm"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 16 }"
      @finish="onSubmitAdd"
    >
      <a-form-item label="标签名" name="tagName">
        <a-input v-model:value="addForm.tagName" placeholder="请输入标签名" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { deleteTagUsingPost, listTagByPageUsingPost, addTagUsingPost } from '@/api/tagController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const updateModalVisible = ref(false)
const addModalVisible = ref(false)
const updating = ref(false)
const adding = ref(false)
// 3. 你的数据模型
// 表单数据
const updateForm = reactive<API.TagVO>({
  id: null,
  tagName: '',
} as API.TagVO)
const addForm = reactive<API.TagVO>({
  tagName: '',
} as API.TagVO)
// 校验规则
const rules = {
  tagName: [{ required: false, message: '标签名', trigger: 'blur' }],
}
// a-form 组件实例
const updateFormNode = ref<any>(null)
// a-form 组件实例
const addFormNode = ref<any>(null)

// 打开编辑对话框
function doUpdate(record: API.TagVO) {
  Object.assign(updateForm, record) // 取消注释此行
  updateModalVisible.value = true
}

// 打开新增对话框
function doAdd() {
  addModalVisible.value = true
}

// onSubmit 里通过 editForm.value.validate() 去验证
async function onSubmitUpdate() {
  if (!updateFormNode.value) return
  const valid = await updateFormNode.value.validate().catch(() => false)
  if (!valid) return

  updating.value = true
  try {
    const res = await addTagUsingPost(updateForm)
    if (res.data.code === 0) {
      message.success('更新成功')
      closeUpdateModal()
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

// onSubmit 里通过 editForm.value.validate() 去验证
async function onSubmitAdd() {
  if (!addFormNode.value) return
  const valid = await addFormNode.value.validate().catch(() => false)
  if (!valid) return
  adding.value = true
  try {
    const res = await addTagUsingPost(addForm)
    if (res.data.code === 0) {
      message.success('更新成功')
      closeAddModal()
      fetchData()
    } else {
      message.error('更新失败：' + res.data.message)
    }
  } catch (e) {
    message.error('保存失败')
  } finally {
    adding.value = false
  }
}

// 关闭对话框并重置表单
function closeUpdateModal() {
  updateModalVisible.value = false
  setTimeout(() => updateForm.value?.resetFields(), 300)
}

// 关闭对话框并重置表单
function closeAddModal() {
  addModalVisible.value = false
  setTimeout(() => addForm.value?.resetFields(), 300)
}

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '标签名',
    dataIndex: 'tagName',
  },
  {
    title: '用户名',
    dataIndex: 'userName',
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
const dataList = ref<API.TagVO[]>([])
const total = ref(0)

// 搜索条件
const searchParams = reactive<API.TagQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'ascend',
})

// 获取数据
const fetchData = async () => {
  const res = await listTagByPageUsingPost({
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
const doDelete = async (record: API.TagVO) => {
  var id = record.id
  if (!id) {
    return
  }
  const res = await deleteTagUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}
</script>
