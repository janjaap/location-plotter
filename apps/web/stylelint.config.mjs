/** @type {import("stylelint").Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-alphabetical-order'],
  rules: {
    'selector-class-pattern': null,
    'rule-empty-line-before': ['always', { except: ['after-single-line-comment', 'first-nested'] }],
  },
};
