import React from 'react'
import RcGantt from 'rc-gantt'
import dayjs from 'dayjs'

interface Data {
  name: string
  startDate: string
  endDate: string
}

const node = {
  name: '一个名称一个名称一个名称一个名称',
  startDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  endDate: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
  collapsed: false, // 默认是折叠起来的
}

const childList = [
  {
    ...node,
    children: [{
      ...node,
      children: [
        {
          ...node,
          children: [
            {
              ...node,
              children: [{ ...node, children: [{ ...node }, { ...node }] }],
            }
          ]
        },
        { ...node },
      ]
    }],
  },
  {
    ...node,
  },
]

const data = Array.from({ length: 5 }).fill({
  ...node,
  children: childList,
}) as Data[]

const onExpand = (record, collapsed) => {
  console.log('onExpand', record, collapsed)
}

const App = () => (
  <div style={{ width: '100%', height: 500 }}>
    <RcGantt<Data>
      data={data}
      onExpand={onExpand}
      columns={[
        {
          name: 'name',
          label: '名称',
        },
        {
          name: 'startDate',
          label: '开始时间',
          width: 100,
        },
        {
          name: 'endDate',
          label: '结束时间',
          // width: 100, // 如果table的colums中每一个都设置了宽度 width，无法
          render: record => <span>{record.endDate}</span>,
        },
      ]}
      onUpdate={async () => true}
    />
  </div>
)

export default App
