# Jamulus User Public Dataset

This project maintains an archive of Jamulus users who have connected to public Jamulus servers. The dataset is available in BigQuery at `dtinth-storage-space.jamulus.clients`.

## Example queries

Query the date range of the dataset:

```sql
WITH d AS (
  SELECT date
  FROM `dtinth-storage-space.jamulus.clients`
  GROUP BY date
) SELECT MIN(date) AS min, MAX(date) AS max FROM d
```

Query the most active users in [MJTH.live](https://mjth.live) server in January 2024:

```sql
WITH daily_rollup AS (
  SELECT client_name, date, server_name, SUM(hours_seen) AS hours_seen
  FROM `dtinth-storage-space.jamulus.clients`
  WHERE server_ip = '150.95.25.226'
  AND (date >= '2024-01-01' AND date < '2024-02-01')
  AND client_instrument NOT IN ('Streamer', 'Recorder')
  AND client_name NOT IN ('No Name', '')
  AND client_name NOT LIKE '% BRB'
  AND client_name NOT LIKE '% AFK'
  GROUP BY client_name, date, server_name
)
SELECT client_name, SUM(hours_seen) AS hours_seen
FROM daily_rollup
WHERE hours_seen < 16 -- If connected more than 16 hours per day, most likely bot/idler
GROUP BY client_name
ORDER BY hours_seen DESC
```
