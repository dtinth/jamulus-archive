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

## Data model

Each row in the table corresponds to a single Jamulus client in a single Jamulus server in a given date and hour. Here are the columns available in the dataset:

- `date`: The date associated with this row. Format is `YYYY-MM-DD`.
- `hour`: Number between 0 and 23, representing the hour of the day in UTC. For example, 0 represents midnight to 1 AM UTC.
- `hours_seen`: Fraction of an hour that this client is seen. For example, if a given client is seen for 30 minutes inside a given server in a given hour, this value would be `0.5`.
- Client information:
  - `client_name`
  - `client_country`
  - `client_city`
  - `client_instrument`
  - `client_skill`
- Server information:
  - `server_name`
  - `server_country`
  - `server_city`
  - `server_ip`
  - `server_port`
  - `server_directory_name`

For example, let's look at this row:

```json
{
  "date": "2024-05-03",
  "hour": "16",
  "hours_seen": "0.36",
  "client_name": "dtinth",
  "client_country": "Thailand",
  "client_city": "Bangkok",
  "client_instrument": "Keyboard",
  "client_skill": "Beginner",
  "server_name": "🏘 MJTH.live",
  "server_country": "Thailand",
  "server_city": "Z.com Cloud, BKK",
  "server_ip": "150.95.25.226",
  "server_port": "22124",
  "server_directory_name": "Any Genre 1"
}
```

It means that on May 3, 2024, I (dtinth) connected to the server "🏘 MJTH.live" for 22 minutes between 4 PM and 5 PM UTC.

## Architecture

This system diagram illustrates the automated workflow for fetching, storing, and processing Jamulus server and client lists, and subsequently loading the processed data into Google BigQuery for querying by users. The process is orchestrated using various cloud services and automation tools.

Every 2 minutes, [Google Cloud Scheduler](https://cloud.google.com/scheduler) triggers [services](https://github.com/dtinth/jamulus-php) to query Jamulus directory servers, saving the data as [snapshot files](https://github.com/dtinth/jamulus-php/blob/master/ARCHIVE.md#access-latest-snapshots) in [Linode Object Storage](https://www.linode.com/products/object-storage/). Daily GitHub Actions [workflow](https://github.com/dtinth/jamulus-php/blob/master/.github/workflows/consolidate.yml) handle archiving, consolidating and compressing snapshot files into [daily archives](https://github.com/dtinth/jamulus-php/blob/master/ARCHIVE.md#accessing-historical-snapshots). Another GitHub Actions [workflow](https://github.com/dtinth/jamulus-archive/blob/main/.github/workflows/etl.yml) later downloads this file, calculates the hourly statistics, and uploads them to [BigQuery](https://cloud.google.com/bigquery/). Users can query the processed data directly from BigQuery.

![image](https://github.com/dtinth/jamulus-archive/assets/193136/78c9fdbe-debb-48da-9dad-0a63c1625927)
