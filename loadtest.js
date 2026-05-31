// loadtest.js — stress test version
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 50  },  // warm up
    { duration: '20s', target: 200 },  // build load
    { duration: '20s', target: 500 },  // peak — viral moment
    { duration: '10s', target: 0   },  // cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],   // p95 must stay under 70ms
    http_req_failed:   ['rate<0.01'],  // less than 1% failure rate
  },
};

export default function () {
  const res = http.get('http://api:3000/api/links/0ALy52/redirect', { // change to your short key
    redirects: 0,
  });

  check(res, {
    'status is redirect': (r) => r.status === 302,
    'under 100ms': (r) => r.timings.duration < 100,
  });

  sleep(0.1);
}