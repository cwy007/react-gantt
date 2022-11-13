import React from 'react'
import RcGantt, { Gantt } from 'rc-gantt'
import dayjs from 'dayjs'

interface Data {
  name: string
  startDate: string
  endDate: string
}

const data = [
  {
    name: '一个名称一个名称一个名称一个名称',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
    id: '1',
  },
  {
    name: '一个名称一个名称一个名称一个名称',
    startDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
    endDate: dayjs().add(2, 'week').format('YYYY-MM-DD'),
    id: '2',
  },
  {
    name: '一个名称一个名称一个名称一个名称',
    startDate: dayjs().add(2, 'week').format('YYYY-MM-DD'),
    endDate: dayjs().add(3, 'week').format('YYYY-MM-DD'),
    id: '3',
  },
]

const dependencies: Gantt.Dependence[] = [
  {
    from: '1',
    to: '2',
    type: 'finish_start',
  },
  {
    from: '2',
    to: '3',
    type: 'finish_start',
  },
]

const App = () => (
  <div style={{ width: '100%', height: 500 }}>
    <RcGantt<Data>
      dependencies={dependencies}
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
      onUpdate={async () => true}
    />
  </div>
)

export default App
