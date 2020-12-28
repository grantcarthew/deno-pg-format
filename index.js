// @ts-nocheck
"use strict";

// Reserved Postgres words
import { reservedMap } from "./reserved.js";

// TODO: Is Deno.Buffer the correct way to handle buffers?
const { Buffer } = Deno;

const fmtPattern = {
  ident: "I",
  literal: "L",
  string: "s",
};

/**
 * Convert to Postgres default ISO 8601 format
 * @param {string} date
 */
function formatDate(date) {
  date = date.replace("T", " ");
  date = date.replace("Z", "+00");
  return date;
}

/**
 * @param {string} value
 */
function isReserved(value) {
  if (reservedMap[value.toUpperCase()]) return true;
  return false;
}

/**
 * @param {boolean} useSpace
 * @param {string | any[]} array
 * @param {{ (value: any): any; (value: any): any; (arg0: any): string | number; }} formatter
 */
function arrayToList(useSpace, array, formatter) {
  let sql = "";

  sql += useSpace ? " (" : "(";
  for (let i = 0; i < array.length; i++) {
    sql += (i === 0 ? "" : ", ") + formatter(array[i]);
  }
  sql += ")";

  return sql;
}

/**
 * Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
 * @param {boolean | any[] | null | undefined} value
 */
function quoteIdent(value) {
  if (value === undefined || value === null) {
    throw new Error("SQL identifier cannot be null or undefined");
  }
  if (value === false) return '"f"';
  if (value === true) return '"t"';
  if (value instanceof Date) return `"${formatDate(value.toISOString())}"`;
  if (value instanceof Buffer) {
    throw new Error("SQL identifier cannot be a buffer");
  }
  if (Array.isArray(value) === true) {
    const temp = [];
    for (let i = 0; i < value.length; i++) {
      if (Array.isArray(value[i]) === true) {
        throw new Error(
          "Nested array to grouped list conversion is not supported for SQL identifier",
        );
      } else {
        temp.push(quoteIdent(value[i]));
      }
    }
    return temp.toString();
  }
  if (value === Object(value)) {
    throw new Error("SQL identifier cannot be an object");
  }

  const ident = value.toString().slice(0); // create copy

  // Do not quote a valid, unquoted identifier
  if (
    /^[a-z_][a-z0-9_$]*$/.test(ident) === true && isReserved(ident) === false
  ) {
    return ident;
  }

  let quoted = '"';
  for (let i = 0; i < ident.length; i++) {
    const c = ident[i];
    if (c === '"') {
      quoted += c + c;
    } else {
      quoted += c;
    }
  }
  quoted += '"';

  return quoted;
} /**
 * Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
 * @param {boolean | any[] | null | undefined} value
 */

function quoteLiteral(value) {
  let literal = null;
  let explicitCast = null;

  if (value === undefined || value === null) return "NULL";
  if (value === false) return "'f'";
  if (value === true) return "'t'";
  if (value instanceof Date) return "'" + formatDate(value.toISOString()) + "'";
  if (value instanceof Buffer) return "E'\\\\x" + value.toString("hex") + "'";
  if (Array.isArray(value) === true) {
    const temp = [];
    for (let i = 0; i < value.length; i++) {
      if (Array.isArray(value[i]) === true) {
        temp.push(arrayToList(i !== 0, value[i], quoteLiteral));
      } else {
        temp.push(quoteLiteral(value[i]));
      }
    }
    return temp.toString();
  }
  if (value === Object(value)) {
    explicitCast = "jsonb";
    literal = JSON.stringify(value);
  } else {
    literal = value.toString().slice(0); // create copy
  }

  let hasBackslash = false;
  let quoted = "'";

  for (let i = 0; i < literal.length; i++) {
    const c = literal[i];
    if (c === "'") {
      quoted += c + c;
    } else if (c === "\\") {
      quoted += c + c;
      hasBackslash = true;
    } else {
      quoted += c;
    }
  }

  quoted += "'";
  if (hasBackslash === true) quoted = "E" + quoted;
  if (explicitCast) quoted += "::" + explicitCast;

  return quoted;
} /**
 * @param {boolean | any[] | null | undefined} value
 */

function quoteString(value) {
  if (value === undefined || value === null) return "";
  if (value === false) return "f";
  if (value === true) return "t";
  if (value instanceof Date) return formatDate(value.toISOString());
  if (value instanceof Buffer) return "\\x" + value.toString("hex");
  if (Array.isArray(value) === true) {
    const temp = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== null && value[i] !== undefined) {
        if (Array.isArray(value[i]) === true) {
          temp.push(arrayToList(i !== 0, value[i], quoteString));
        } else {
          temp.push(quoteString(value[i]));
        }
      }
    }
    return temp.toString();
  }
  if (value === Object(value)) return JSON.stringify(value);

  return value.toString().slice(0); // Return copy
}

/**
 * @param {{ pattern: { ident: string; literal: string; string: string; }; }} cfg
 */
function config(cfg) {
  // Default
  fmtPattern.ident = "I";
  fmtPattern.literal = "L";
  fmtPattern.string = "s";

  if (cfg && cfg.pattern) {
    if (cfg.pattern.ident) fmtPattern.ident = cfg.pattern.ident;
    if (cfg.pattern.literal) fmtPattern.literal = cfg.pattern.literal;
    if (cfg.pattern.string) fmtPattern.string = cfg.pattern.string;
  }
}

/**
 * @param {string} fmt
 * @param {any[]} parameters
 */
function formatWithArray(fmt, parameters) {
  let index = 0;
  const params = parameters;

  let re = "%(%|(\\d+\\$)?[";
  re += fmtPattern.ident;
  re += fmtPattern.literal;
  re += fmtPattern.string;
  re += "])";
  re = new RegExp(re, "g");

  return fmt.replace(
    re, /**
     * @param {any} _
     * @param {string} type
     */
    function (_, type) {
      if (type === "%") {
        return "%";
      }

      let position = index;
      const tokens = type.split("$");

      if (tokens.length > 1) {
        position = parseInt(tokens[0]) - 1;
        type = tokens[1];
      }

      if (position < 0) {
        throw new Error("specified argument 0 but arguments start at 1");
      } else if (position > params.length - 1) {
        throw new Error("too few arguments");
      }

      index = position + 1;

      if (type === fmtPattern.ident) return quoteIdent(params[position]);
      if (type === fmtPattern.literal) return quoteLiteral(params[position]);
      if (type === fmtPattern.string) return quoteString(params[position]);
    },
  );
}

/**
 * @param {any} fmt
 */
function format(fmt) {
  let args = Array.prototype.slice.call(arguments);
  args = args.slice(1); // first argument is fmt
  return formatWithArray(fmt, args);
}

format.config = config;
format.ident = quoteIdent;
format.literal = quoteLiteral;
format.string = quoteString;
format.withArray = formatWithArray;

export { format };
export default format;
