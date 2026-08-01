import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fixtureUrl = new URL("../fixtures/interest-cases.json", import.meta.url);
const suite = JSON.parse(readFileSync(fixtureUrl, "utf8"));

const REQUIRED_CASES = new Set([
  "base_15_day_cycle",
  "base_30_day_cycle_short_final",
  "partial_principal_mid_period",
  "rate_change_effective_date",
  "interest_under_over_carry",
  "early_settlement",
  "overdue_without_penalty",
  "bad_debt_pause_resume",
  "round_half_up_at_period_end",
  "reversed_principal_payment",
]);

const INTEGER_PATTERN = /^-?\d+$/;
const UNSIGNED_INTEGER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SIGNED_MONEY_KEYS = new Set([
  "interestBalanceVnd",
  "openingInterestBalanceVnd",
  "closingInterestBalanceVnd",
]);

function parseLocalDate(value) {
  assert.match(value, LOCAL_DATE_PATTERN);
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  assert.equal(date.toISOString().slice(0, 10), value, `Ngày không hợp lệ: ${value}`);
  return date;
}

function addDays(value, days) {
  const date = parseLocalDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(startDate, endDate) {
  const start = parseLocalDate(startDate).getTime();
  const end = parseLocalDate(endDate).getTime();
  assert.ok(end >= start, `${endDate} phải không nhỏ hơn ${startDate}`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

function gcd(a, b) {
  let left = a < 0n ? -a : a;
  let right = b < 0n ? -b : b;
  while (right !== 0n) {
    [left, right] = [right, left % right];
  }
  return left;
}

function normalizeFraction(numerator, denominator) {
  assert.ok(denominator > 0n);
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function addFractions(left, right) {
  return normalizeFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function decimalToFraction(value) {
  assert.match(value, DECIMAL_PATTERN);
  const [whole, fraction = ""] = value.split(".");
  const denominator = 10n ** BigInt(fraction.length);
  return normalizeFraction(BigInt(`${whole}${fraction}`), denominator);
}

function segmentInterest(segment) {
  const rate = decimalToFraction(segment.dailyRatePercent);
  return normalizeFraction(
    BigInt(segment.principalVnd) * rate.numerator * BigInt(segment.dayCount),
    rate.denominator * 100n,
  );
}

function roundHalfUp(value) {
  assert.ok(value.numerator >= 0n);
  return (value.numerator * 2n + value.denominator) / (value.denominator * 2n);
}

function assertMoneyStrings(value, path = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertMoneyStrings(item, [...path, index]));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];
    if (key.endsWith("Vnd")) {
      assert.equal(typeof child, "string", `${childPath.join(".")} phải là string`);
      assert.match(child, INTEGER_PATTERN, `${childPath.join(".")} phải là số nguyên`);
      if (!SIGNED_MONEY_KEYS.has(key)) {
        assert.match(
          child,
          UNSIGNED_INTEGER_PATTERN,
          `${childPath.join(".")} không được âm`,
        );
      }
    } else {
      assertMoneyStrings(child, childPath);
    }
  }
}

function effectiveEvents(events) {
  const reversedIds = new Set(
    events.filter((event) => event.type === "REVERSAL").map((event) => event.reversesTransactionId),
  );
  return events.filter((event) => event.type !== "REVERSAL" && !reversedIds.has(event.id));
}

function expectedStatus(fixture, maturityDate, events) {
  const settlement = events.find((event) => event.type === "SETTLEMENT");
  if (settlement) {
    return "SETTLED";
  }

  const statusEvents = events
    .filter((event) => event.type === "BAD_DEBT_START" || event.type === "INTEREST_RESUME")
    .sort((left, right) => left.date.localeCompare(right.date));
  const lastStatusEvent = statusEvents.at(-1);
  if (lastStatusEvent?.type === "BAD_DEBT_START") {
    return "BAD_DEBT";
  }

  return fixture.input.asOfDate > maturityDate ? "OVERDUE" : "ACTIVE";
}

test("fixture suite metadata and required coverage", () => {
  assert.equal(suite.schemaVersion, 1);
  assert.equal(suite.currency, "VND");
  assert.equal(suite.timezone, "Asia/Ho_Chi_Minh");
  assert.equal(suite.rounding, "HALF_UP_AT_PERIOD_END");

  const caseIds = suite.cases.map((fixture) => fixture.id);
  assert.equal(new Set(caseIds).size, caseIds.length, "Fixture ID phải duy nhất");
  for (const requiredCase of REQUIRED_CASES) {
    assert.ok(caseIds.includes(requiredCase), `Thiếu fixture ${requiredCase}`);
  }

  assertMoneyStrings(suite);
});

for (const fixture of suite.cases) {
  test(`domain fixture: ${fixture.id}`, () => {
    const { input, expected } = fixture;
    assert.ok(input.termDays > 0 && Number.isInteger(input.termDays));
    assert.ok([15, 30].includes(input.interestCycleDays));
    assert.match(input.initialDailyRatePercent, DECIMAL_PATTERN);

    const maturityDate = addDays(input.disbursementDate, input.termDays - 1);
    assert.equal(expected.maturityDate, maturityDate);

    const eventIds = input.events.map((event) => event.id);
    assert.equal(new Set(eventIds).size, eventIds.length, "Event ID phải duy nhất");
    for (const event of input.events) {
      parseLocalDate(event.date);
      if (event.type === "REVERSAL") {
        const original = input.events.find((candidate) => candidate.id === event.reversesTransactionId);
        assert.ok(original, `Không tìm thấy giao dịch gốc ${event.reversesTransactionId}`);
        assert.notEqual(original.type, "REVERSAL", "Không cho reversal một reversal");
        assert.ok(event.note.trim().length > 0, "Reversal phải có lý do");
      }
    }

    const events = effectiveEvents(input.events);
    assert.equal(expected.status, expectedStatus(fixture, maturityDate, events));

    let principalOutstanding = BigInt(input.originalPrincipalVnd);
    for (const event of events) {
      if (event.type === "PRINCIPAL_PAYMENT") {
        principalOutstanding -= BigInt(event.amountVnd);
      }
      if (event.type === "SETTLEMENT") {
        principalOutstanding -= BigInt(event.principalAmountVnd);
      }
    }
    assert.ok(principalOutstanding >= 0n, "Dư nợ không được âm");
    assert.equal(expected.principalOutstandingVnd, principalOutstanding.toString());

    let previousEndDate;
    let rollingInterestBalance = 0n;
    for (const period of expected.periods) {
      assert.equal(period.dayCount, inclusiveDays(period.startDate, period.endDate));
      if (previousEndDate) {
        assert.equal(period.startDate, addDays(previousEndDate, 1), "Các kỳ phải liên tục");
      } else {
        assert.equal(period.startDate, input.disbursementDate);
      }
      previousEndDate = period.endDate;

      let rawPeriodInterest = { numerator: 0n, denominator: 1n };
      let previousSegmentEnd;
      for (const segment of period.segments) {
        assert.equal(segment.dayCount, inclusiveDays(segment.startDate, segment.endDate));
        assert.ok(segment.startDate >= period.startDate && segment.endDate <= period.endDate);
        assert.match(segment.principalVnd, UNSIGNED_INTEGER_PATTERN);
        assert.match(segment.dailyRatePercent, DECIMAL_PATTERN);
        if (previousSegmentEnd) {
          assert.ok(segment.startDate > previousSegmentEnd, "Segment không được chồng ngày");
        }
        previousSegmentEnd = segment.endDate;
        rawPeriodInterest = addFractions(rawPeriodInterest, segmentInterest(segment));
      }

      const accruedInterest = roundHalfUp(rawPeriodInterest);
      assert.equal(period.accruedInterestVnd, accruedInterest.toString());
      assert.equal(period.openingInterestBalanceVnd, rollingInterestBalance.toString());

      const periodPayments = events
        .filter((event) => event.date >= period.startDate && event.date <= period.endDate)
        .reduce((sum, event) => {
          if (event.type === "INTEREST_PAYMENT") {
            return sum + BigInt(event.amountVnd);
          }
          if (event.type === "SETTLEMENT") {
            return sum + BigInt(event.interestAmountVnd);
          }
          return sum;
        }, 0n);
      assert.equal(period.interestPaymentsVnd, periodPayments.toString());

      rollingInterestBalance += accruedInterest - periodPayments;
      assert.equal(period.closingInterestBalanceVnd, rollingInterestBalance.toString());
    }

    assert.equal(expected.interestBalanceVnd, rollingInterestBalance.toString());
  });
}
