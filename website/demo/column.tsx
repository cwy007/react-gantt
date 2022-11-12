import React from 'react'
import RcGantt from 'rc-gantt'
import dayjs from 'dayjs'

interface Data {
  name: string
  startDate: string
  endDate: string
}

const data = Array.from({ length: 100 }).fill({
  name: '一个名称一个名称一个名称一个名称',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
}) as Data[]

const App = () => (
  <div style={{ width: '100%', height: 500 }}>
    <RcGantt<Data>
      data={data}
      columns={[
        {
          name: 'name',
          label: '名称',
          width: 200,
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
      tableIndent={0}
      onUpdate={async () => true}
      // tableCollapseAble={false}
    />
  </div>
)

export default App
