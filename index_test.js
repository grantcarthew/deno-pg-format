//
// Original source from https://github.com/segmentio/pg-escape
//
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std/testing/asserts.ts";
import { format } from "./index.js";
const { test } = Deno;
var testDate = new Date(Date.UTC(2012, 11, 14, 13, 6, 43, 152));
var testArray = ["abc", 1, true, null, testDate];
var testIdentArray = ["abc", "AbC", 1, true, testDate];
var testObject = { a: 1, b: 2 };
var testNestedArray = [[1, 2], [3, 4], [5, 6]];

test("format(fmt, ...) - %s should format as a simple string", () => {
  assertEquals(format("some %s here", "thing"), "some thing here");
  assertEquals(
    format("some %s thing %s", "long", "here"),
    "some long thing here",
  );
});

test("format(fmt, ...) - %s should format array of array as simple string", () => {
  assertEquals(
    format("many %s %s", "things", testNestedArray),
    "many things (1, 2), (3, 4), (5, 6)",
  );
});

test("format(fmt, ...) - %s should format string using position field", () => {
  assertEquals(format("some %1$s", "thing"), "some thing");
  assertEquals(format("some %1$s %1$s", "thing"), "some thing thing");
  assertEquals(format("some %1$s %s", "thing", "again"), "some thing again");
  assertEquals(format("some %1$s %2$s", "thing", "again"), "some thing again");
  assertEquals(
    format("some %1$s %2$s %1$s", "thing", "again"),
    "some thing again thing",
  );
  assertEquals(
    format("some %1$s %2$s %s %1$s", "thing", "again", "some"),
    "some thing again some thing",
  );
});

test("format(fmt, ...) - %s should not format string using position 0", () => {
  assertThrows(() => {
    format("some %0$s", "thing");
  });
});

test("format(fmt, ...) - %s should not format string using position field with too few arguments", () => {
  assertThrows(() => {
    format("some %2$s", "thing");
  });
});

test("format(fmt, ...) - %% should format as %", () => {
  assertEquals(format("some %%", "thing"), "some %");
});

test("format(fmt, ...) - %% should not eat args", () => {
  assertEquals(format("just %% a %s", "test"), "just % a test");
});

test("format(fmt, ...) - %% should not format % using position field", () => {
  assertEquals(format("%1$%", "thing"), "%1$%");
});

test("format(fmt, ...) - %I should format as an identifier", () => {
  assertEquals(format("some %I", "foo/bar/baz"), 'some "foo/bar/baz"');
});

test("format(fmt, ...) - %I should not format array of array as an identifier", () => {
  assertThrows(() => {
    format("many %I %I", "foo/bar/baz", testNestedArray);
  });
});

test("format(fmt, ...) - %I should format identifier using position field", () => {
  assertEquals(format("some %1$I", "thing"), "some thing");
  assertEquals(format("some %1$I %1$I", "thing"), "some thing thing");
  assertEquals(format("some %1$I %I", "thing", "again"), "some thing again");
  assertEquals(format("some %1$I %2$I", "thing", "again"), "some thing again");
  assertEquals(
    format("some %1$I %2$I %1$I", "thing", "again"),
    "some thing again thing",
  );
  assertEquals(
    format("some %1$I %2$I %I %1$I", "thing", "again", "huh"),
    "some thing again huh thing",
  );
});

test("format(fmt, ...) - %I should not format identifier using position 0", () => {
  assertThrows(() => {
    format("some %0$I", "thing");
  });
});

test("format(fmt, ...) - %I should not format identifier using position field with too few arguments", () => {
  assertThrows(() => {
    format("some %2$I", "thing");
  });
});

test("format(fmt, ...) - %L should format as a literal", () => {
  assertEquals(format("%L", "Tobi's"), "'Tobi''s'");
});

test("format(fmt, ...) - %L should format array of array as a literal", () => {
  assertEquals(
    format("%L", testNestedArray),
    "('1', '2'), ('3', '4'), ('5', '6')",
  );
});

test("format(fmt, ...) - %L should format literal using position field", () => {
  assertEquals(format("some %1$L", "thing"), "some 'thing'");
  assertEquals(format("some %1$L %1$L", "thing"), "some 'thing' 'thing'");
  assertEquals(
    format("some %1$L %L", "thing", "again"),
    "some 'thing' 'again'",
  );
  assertEquals(
    format("some %1$L %2$L", "thing", "again"),
    "some 'thing' 'again'",
  );
  assertEquals(
    format("some %1$L %2$L %1$L", "thing", "again"),
    "some 'thing' 'again' 'thing'",
  );
  assertEquals(
    format("some %1$L %2$L %L %1$L", "thing", "again", "some"),
    "some 'thing' 'again' 'some' 'thing'",
  );
});

test("format(fmt, ...) - %L should not format literal using position 0", () => {
  assertThrows(() => {
    format("some %0$L", "thing");
  });
});

test("format(fmt, ...) - %L should not format literal using position field with too few arguments", () => {
  assertThrows(() => {
    format("some %2$L", "thing");
  });
});

test("format.withArray(fmt, args) - %s should format as a simple string", () => {
  assertEquals(format.withArray("some %s here", ["thing"]), "some thing here");
  assertEquals(
    format.withArray("some %s thing %s", ["long", "here"]),
    "some long thing here",
  );
});

test("format.withArray(fmt, args) - %s should format array of array as simple string", () => {
  assertEquals(
    format.withArray("many %s %s", ["things", testNestedArray]),
    "many things (1, 2), (3, 4), (5, 6)",
  );
});
//   })

test("format.withArray(fmt, args) - %% should format as %", () => {
  assertEquals(format.withArray("some %%", ["thing"]), "some %");
});

test("format.withArray(fmt, args) - %% should not eat args", () => {
  assertEquals(format.withArray("just %% a %s", ["test"]), "just % a test");
  assertEquals(
    format.withArray("just %% a %s %s %s", ["test", "again", "and again"]),
    "just % a test again and again",
  );
});

test("format.withArray(fmt, args) - %I should format as an identifier", () => {
  assertEquals(
    format.withArray("some %I", ["foo/bar/baz"]),
    'some "foo/bar/baz"',
  );
  assertEquals(
    format.withArray("some %I and %I", ["foo/bar/baz", "#hey"]),
    'some "foo/bar/baz" and "#hey"',
  );
});

test("format.withArray(fmt, args) - %I should not format array of array as an identifier", () => {
  assertThrows(() => {
    format.withArray("many %I %I", ["foo/bar/baz", testNestedArray]);
  });
});

//   describe('%L', () => {
test("format.withArray(fmt, args) - %L should format as a literal", () => {
  assertEquals(format.withArray("%L", ["Tobi's"]), "'Tobi''s'");
  assertEquals(
    format.withArray("%L %L", ["Tobi's", "birthday"]),
    "'Tobi''s' 'birthday'",
  );
});

test("format.withArray(fmt, args) - %L should format array of array as a literal", () => {
  assertEquals(
    format.withArray("%L", [testNestedArray]),
    "('1', '2'), ('3', '4'), ('5', '6')",
  );
});

test("format.string(val) - should coerce to a string", () => {
  assertEquals(format.string(undefined), "");
  assertEquals(format.string(null), "");
  assertEquals(format.string(true), "t");
  assertEquals(format.string(false), "f");
  assertEquals(format.string(0), "0");
  assertEquals(format.string(15), "15");
  assertEquals(format.string(-15), "-15");
  assertEquals(format.string(45.13), "45.13");
  assertEquals(format.string(-45.13), "-45.13");
  assertEquals(format.string("something"), "something");
  assertEquals(format.string(testArray), "abc,1,t,2012-12-14 13:06:43.152+00");
  assertEquals(format.string(testNestedArray), "(1, 2), (3, 4), (5, 6)");
  assertEquals(format.string(testDate), "2012-12-14 13:06:43.152+00");
  assertEquals(format.string(testObject), '{"a":1,"b":2}');
});

// describe('format.ident(val)', () => {
test("format.ident(val) - Should quote when necessary", () => {
  assertEquals(format.ident("foo"), "foo");
  assertEquals(format.ident("_foo"), "_foo");
  assertEquals(format.ident("_foo_bar$baz"), "_foo_bar$baz");
  assertEquals(format.ident("test.some.stuff"), '"test.some.stuff"');
  assertEquals(format.ident('test."some".stuff'), '"test.""some"".stuff"');
});

test("format.ident(val) - Should quote reserved words", () => {
  assertEquals(format.ident("desc"), '"desc"');
  assertEquals(format.ident("join"), '"join"');
  assertEquals(format.ident("cross"), '"cross"');
});

test("format.ident(val) - Should quote", () => {
  assertEquals(format.ident(true), '"t"');
  assertEquals(format.ident(false), '"f"');
  assertEquals(format.ident(0), '"0"');
  assertEquals(format.ident(15), '"15"');
  assertEquals(format.ident(-15), '"-15"');
  assertEquals(format.ident(45.13), '"45.13"');
  assertEquals(format.ident(-45.13), '"-45.13"');
  assertEquals(
    format.ident(testIdentArray),
    'abc,"AbC","1","t","2012-12-14 13:06:43.152+00"',
  );
  assertThrows(() => {
    assertThrows(format.ident(testNestedArray));
  });
  assertEquals(format.ident(testDate), '"2012-12-14 13:06:43.152+00"');
});

test("format.ident(val) - Should throw when undefined", function (done) {
  assertThrows(
    () => {
      assertThrows(format.ident(undefined));
    },
    Error,
    "SQL identifier cannot be null or undefined",
  );
});

test("format.ident(val) - Should throw when null", function (done) {
  assertThrows(
    () => {
      assertThrows(format.ident(null));
    },
    Error,
    "SQL identifier cannot be null or undefined",
  );
});

test("format.ident(val) - Should throw when object", function (done) {
  assertThrows(
    () => {
      assertThrows(format.ident({}));
    },
    Error,
    "SQL identifier cannot be an object",
  );
});

test("format.literal(val) - Should return NULL for null", () => {
  assertEquals(format.literal(null), "NULL");
  assertEquals(format.literal(undefined), "NULL");
});

test("format.literal(val) - Should quote", () => {
  assertEquals(format.literal(true), "'t'");
  assertEquals(format.literal(false), "'f'");
  assertEquals(format.literal(0), "'0'");
  assertEquals(format.literal(15), "'15'");
  assertEquals(format.literal(-15), "'-15'");
  assertEquals(format.literal(45.13), "'45.13'");
  assertEquals(format.literal(-45.13), "'-45.13'");
  assertEquals(format.literal("hello world"), "'hello world'");
  assertEquals(
    format.literal(testArray),
    "'abc','1','t',NULL,'2012-12-14 13:06:43.152+00'",
  );
  assertEquals(
    format.literal(testNestedArray),
    "('1', '2'), ('3', '4'), ('5', '6')",
  );
  assertEquals(format.literal(testDate), "'2012-12-14 13:06:43.152+00'");
  assertEquals(format.literal(testObject), '\'{"a":1,"b":2}\'::jsonb');
});

test("format.literal(val) - Should format quotes", () => {
  assertEquals(format.literal("O'Reilly"), "'O''Reilly'");
});

test("format.literal(val) - Should format backslashes", () => {
  assertEquals(format.literal("\\whoop\\"), "E'\\\\whoop\\\\'");
});
