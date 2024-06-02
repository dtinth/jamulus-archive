# Jamulus Usage Public Dataset

This project maintains an archive of Jamulus users who have connected to public Jamulus servers.

The dataset is available on [Google Cloud BigQuery](https://cloud.google.com/bigquery/) at `dtinth-storage-space.jamulus.clients`.

## Getting started

You can query this dataset for free, as [BigQuery offers a free quota](https://cloud.google.com/bigquery/docs/sandbox) that allows you to query up to 1 TB of data per month. You don't need to enable billing or set up a payment method to use this free quota.

To query the Jamulus Usage Public Dataset using BigQuery, follow these steps:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project.
3. Navigate to the [BigQuery service](https://console.cloud.google.com/bigquery). You should see the **BigQuery Studio.**
4. In the welcome screen, under the **Create new** section, click on **SQL query**, then try out one of the sample queries below.

## Sample queries

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
