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
          title: '名称',
          width: 100,
        },
        {
          name: 'startDate',
          title: '开始时间',
          width: 100,
        },
        {
          name: 'endDate',
          title: '结束时间',
          width: 100,
        },
        {
          name: 'startDate',
          title: '开始时间2',
          // width: 100,
        },
        {
          name: 'endDate',
          title: '结束时间2',
          // width: 100,
        },
      ] as any}
      onUpdate={async (row, startDate, endDate) => {
        console.log('update', row, startDate, endDate)
        return true
      }}
    />
  </div>
)

export default App
