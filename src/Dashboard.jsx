import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

function aggregateByFiveMinutes(data) {
  const BUCKET_SIZE = 5 * 60 * 1000 // 5 minutes in ms
  const buckets = {}

  data.forEach(point => {
    const bucketKey = Math.floor(point.timestamp / BUCKET_SIZE) * BUCKET_SIZE

    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        timestamp: bucketKey,
        o2: 0,
        n2o: 0,
        air: 0,
        count: 0
      }
    }

    buckets[bucketKey].o2 += point.o2
    buckets[bucketKey].n2o += point.n2o
    buckets[bucketKey].air += point.air
    buckets[bucketKey].count += 1
  })

  return Object.values(buckets).map(b => ({
    timestamp: b.timestamp,
    o2: b.o2 / b.count,
    n2o: b.n2o / b.count,
    air: b.air / b.count
  }))
}

function Dashboard({ data = [] }) {
  const dashboardData = aggregateByFiveMinutes(data)

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })

  return (
    <div className="container">
      <h2>Input Monitoring</h2>
      <p style={{ fontSize: "14px", color: "#666" }}>
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dashboardData}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip labelFormatter={formatTime} />

          <Line
            type="monotone"
            dataKey="o2"
            stroke="#1f77b4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="n2o"
            stroke="#ff7f0e"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="air"
            stroke="#2ca02c"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


export default Dashboard
