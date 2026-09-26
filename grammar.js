const PREC = {
  ASSIGN: 1,
  OR: 2,
  AND: 3,
  EQUALITY: 4,
  COMPARE: 5,
  ADD: 6,
  MULTIPLY: 7,
  UNARY: 8,
  CALL: 9,
};

module.exports = grammar({
  name: "nulang",

  extras: $ => [
    /[\t \f]/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice(
      $._declaration,
      $._separator,
    )),

    _separator: _ => token(choice(/\r?\n+/, ";")),

    _declaration: $ => choice(
      $.function_declaration,
      $.effect_declaration,
      $.actor_declaration,
    ),

    function_declaration: $ => seq(
      optional("pub"),
      "fn",
      field("name", $.identifier),
      field("parameters", $.parameter_list),
      optional(seq("->", field("return_type", $._type))),
      field("body", $.block),
    ),

    parameter_list: $ => seq(
      "(",
      optional(commaSep1($.parameter)),
      ")",
    ),

    parameter: $ => seq(
      field("name", $.identifier),
      optional(seq(":", field("type", $._type))),
    ),

    effect_declaration: $ => seq(
      "effect",
      field("name", choice($.type_identifier, $.identifier)),
      "{",
      repeat(choice($.effect_operation, $._separator)),
      "}",
    ),

    effect_operation: $ => seq(
      field("name", $.identifier),
      ":",
      optional(field("parameters", choice(
        $.effect_type_list,
        $._type,
      ))),
      "->",
      field("return_type", $._type),
    ),

    effect_type_list: $ => seq(
      "(",
      optional(commaSep1($._type)),
      ")",
    ),

    actor_declaration: $ => seq(
      optional("pub"),
      "actor",
      field("name", choice($.type_identifier, $.identifier)),
      "{",
      repeat(choice(
        $.state_field,
        $.behavior_declaration,
        $.function_declaration,
        $._separator,
      )),
      "}",
    ),

    state_field: $ => seq(
      "state",
      optional(field("model", $.state_model)),
      field("name", $.identifier),
      optional(seq(":", field("type", $._type))),
      choice("=", ":"),
      field("value", $._expression),
    ),

    state_model: _ => choice(
      "local",
      "durable",
      "event_sourced",
      "crdt",
    ),

    behavior_declaration: $ => seq(
      "behavior",
      field("name", $.identifier),
      field("parameters", $.parameter_list),
      optional(seq("->", field("return_type", $._type))),
      field("body", $.block),
    ),

    block: $ => seq(
      "{",
      repeat(choice(
        $._statement,
        $._separator,
      )),
      "}",
    ),

    _statement: $ => choice(
      $.let_statement,
      $.return_statement,
      $._expression,
    ),

    let_statement: $ => seq(
      "let",
      field("name", $.identifier),
      optional(seq(":", field("type", $._type))),
      "=",
      field("value", $._expression),
    ),

    return_statement: $ => seq(
      "return",
      optional(field("value", $._expression)),
    ),

    _expression: $ => choice(
      $.assignment_expression,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.if_expression,
      $.match_expression,
      $.perform_expression,
      $.parenthesized_expression,
      $.block,
      $.identifier,
      $.type_identifier,
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.boolean_literal,
      $.nil_literal,
      $.unit_literal,
    ),

    assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
      field("left", choice($.identifier, $.call_expression)),
      "=",
      field("right", $._expression),
    )),

    binary_expression: $ => choice(
      ...[
        ["||", PREC.OR],
        ["&&", PREC.AND],
        ["==", PREC.EQUALITY],
        ["!=", PREC.EQUALITY],
        ["<", PREC.COMPARE],
        [">", PREC.COMPARE],
        ["<=", PREC.COMPARE],
        [">=", PREC.COMPARE],
        ["+", PREC.ADD],
        ["-", PREC.ADD],
        ["*", PREC.MULTIPLY],
        ["/", PREC.MULTIPLY],
        ["%", PREC.MULTIPLY],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field("left", $._expression),
          operator,
          field("right", $._expression),
        ))
      ),
    ),

    unary_expression: $ => prec(PREC.UNARY, seq(
      field("operator", choice("-", "!")),
      field("operand", $._expression),
    )),

    call_expression: $ => prec.left(PREC.CALL, seq(
      field("function", choice($.identifier, $.type_identifier, $.call_expression)),
      field("arguments", $.argument_list),
    )),

    argument_list: $ => seq(
      "(",
      optional(commaSep1($._expression)),
      ")",
    ),

    parenthesized_expression: $ => seq(
      "(",
      field("expression", $._expression),
      ")",
    ),

    if_expression: $ => prec.right(seq(
      "if",
      field("condition", $._expression),
      optional("then"),
      field("consequence", $.block),
      optional(seq(
        "else",
        field("alternative", choice($.if_expression, $.block)),
      )),
    )),

    match_expression: $ => seq(
      "match",
      field("value", $._expression),
      "{",
      repeat(choice($.match_arm, $._separator)),
      "}",
    ),

    match_arm: $ => seq(
      optional("case"),
      field("pattern", $.pattern),
      "=>",
      field("value", $._expression),
    ),

    pattern: $ => choice(
      "_",
      $.integer_literal,
      $.string_literal,
      $.boolean_literal,
      $.identifier,
      seq(
        $.type_identifier,
        optional(seq(
          "(",
          optional(commaSep1($.pattern)),
          ")",
        )),
      ),
    ),

    perform_expression: $ => prec(PREC.CALL, seq(
      "perform",
      field("effect", choice($.type_identifier, $.identifier)),
      ".",
      field("operation", $.identifier),
      field("arguments", $.argument_list),
    )),

    _type: $ => choice(
      $.named_type,
      $.tuple_type,
      $.function_type,
    ),

    named_type: $ => seq(
      choice($.type_identifier, $.identifier),
      optional($.type_arguments),
    ),

    type_arguments: $ => seq(
      "[",
      commaSep1($._type),
      "]",
    ),

    tuple_type: $ => seq(
      "(",
      optional(commaSep1($._type)),
      ")",
    ),

    function_type: $ => prec.right(seq(
      field("parameter", choice($.named_type, $.tuple_type)),
      "->",
      field("result", $._type),
    )),

    identifier: _ => /[a-z_][a-zA-Z0-9_]*/,
    type_identifier: _ => /[A-Z][a-zA-Z0-9_]*/,

    integer_literal: _ => token(choice(
      /0x[0-9a-fA-F_]+/,
      /0b[01_]+/,
      /0o[0-7_]+/,
      /[0-9][0-9_]*/,
    )),

    float_literal: _ => token(/[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9]+)?/),

    string_literal: _ => token(seq(
      '"',
      repeat(choice(
        /[^"\\\n]/,
        /\\./,
      )),
      '"',
    )),

    boolean_literal: _ => choice("true", "false"),
    nil_literal: _ => "nil",
    unit_literal: _ => "unit",

    comment: _ => token(choice(
      seq("//", /[^\n]*/),
      seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
    )),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
