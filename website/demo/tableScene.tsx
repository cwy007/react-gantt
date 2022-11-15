import React from 'react'
import RcGantt from 'rc-gantt'
import dayjs from 'dayjs'
import { mock } from 'mockjs';
import { Cells, TableScene } from 'newcore-table-scene';
import { useRequest } from 'ahooks';


const App = () => {
  const { data = [] } = useRequest(() => getDataSource({ pageSize: 20 }));
  console.log('data-->', data)


  const getChildDataSource = (level: number) =>
    level > 0
      ? [
          {
            // key: '@natural',
            name: '@name',
            age: '@natural(0, 100)',
            address: '@county(true)',
            number: 2,
            level,
            [`children|0-${level}`]: getChildDataSource(level - 1),
            startDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            endDate: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
        ]
      : [
          {
            key: '@natural',
            name: '@name',
            age: '@natural(0, 100)',
            address: '@county(true)',
            number: 2,
            level,
            startDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            endDate: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
            children: [],
          },
        ];

    const getAllDataSource = (total) => {
    return mock({
      [`dataSource|${total}`]: getChildDataSource(5),
      total,
    });
    };

  const total = mock('@natural(300, 800)');

  const allDataSource = getAllDataSource(total);
  console.log('allDataSource-->', allDataSource)

  function getAllList<T extends { children?: T[]; }>(list: T[]): T[] {
    let result: T[] = [];
    list.forEach((v) => {
      result.push({
        ...v,
        children: [],
      });
      if (v.children && v.children.length > 0) {
        result = result.concat(getAllList(v.children));
      }
    });
    return result;
  }

  const getDataSource = ({ pageSize, current = 1 }) => new Promise((resolve) => {
    setTimeout(() => {
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      resolve({
        total: allDataSource.total,
        dataSource: allDataSource.dataSource.slice(start, end),
        childTotal: getAllList(allDataSource.dataSource).length,
      });
    }, 1000);
  });

  const columns = [
    {
      title: '列表Index',
      width: 100,
      key: 'index',
      render: (record, { treeIndex }) => {
        return <Cells.Text text={treeIndex?.join(';')} />;
      },
    },
    {
      title: 'level',
      width: 100,
      key: 'level',
      align: 'center',
      filter: { type: 'input' },
      getValue: (record) => record.level,
      render(record) {
        return String(record.level);
      },
    },
    {
      title: 'Full Name',
      width: 100,
      key: 'name',
      render(record) {
        return <Cells.Text text={record.name} />;
      },
    },
    {
      title: 'Age',
      width: 100,
      key: 'age',
      filter: { type: 'input' },
      getValue: (record) => record.age,
      render(record) {
        return <Cells.Text text={record.age} />;
      },
    },
    {
      title: 'number',
      width: 100,
      key: 'number',
      render(record) {
        return <Cells.Quantity quantity={record.number} />;
      },
    },
    {
      title: 'Column 1',
      key: '1',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 2',
      key: '2',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 3',
      key: '3',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 4',
      key: '4',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 5',
      key: '5',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 6',
      key: '6',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 7',
      key: '7',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Column 8',
      key: '8',
      render(record) {
        return <Cells.Text text={record.address} />;
      },
    },
    {
      title: 'Action',
      key: 'operation',
      fixed: 'right',
      width: 100,
      render(record) {
        return <Cells.Text text={record.index} />;
      },
    },
  ];

  const onExpand = (record, collapsed) => {
    console.log('onExpand', record, collapsed)
  }

  return (
    <div style={{ width: '100%', height: 500 }}>
      <RcGantt<any>
        data={data as any}
        onExpand={onExpand}
        columns={columns as any}
        onUpdate={async () => true}
      />
    </div>
  )
}

export default App
