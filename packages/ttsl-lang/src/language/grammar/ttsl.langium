grammar TTSL

// -----------------------------------------------------------------------------
// Base interfaces
// -----------------------------------------------------------------------------

interface TslObject {}

interface TslAbstractCall extends TslObject {
    argumentList: TslArgumentList
}

interface TslDeclaration extends TslObject {
    name: string
    visibility?: TslVisibility
}

interface TslLocalVariable extends TslDeclaration {
    groupedBy?: TslGroupedBy
    value?: TslExpression
    type?: TslType
}

TslLocalVariable returns TslLocalVariable:
    name=ID
;

// -----------------------------------------------------------------------------
// Module
// -----------------------------------------------------------------------------

interface TslModule extends TslDeclaration {
    imports: TslImport[];
    members: TslObject[]
}

entry TslModule returns TslModule:
    {TslModule}
    (
        ('package' name=QualifiedName)
        imports+=TslImport*
        members+=TslModuleMember*

    |   imports+=TslImport+
        members+=TslModuleMember*

    |   members+=TslModuleMember*
    )?
;

interface TslImport extends TslObject {
    package: string;
}

TslImport returns TslImport:
    TslQualifiedImport
  | TslWildcardImport
;


interface TslQualifiedImport extends TslImport {
    importedDeclarationList: TslImportedDeclarationList;
}

TslQualifiedImport returns TslQualifiedImport:
    'from'
    package=QualifiedName
    'import'
    importedDeclarationList=TslImportedDeclarationList
;

interface TslImportedDeclarationList extends TslObject {
    importedDeclarations: TslImportedDeclaration[]
}

TslImportedDeclarationList returns TslImportedDeclarationList:
    importedDeclarations+=TslImportedDeclaration (',' importedDeclarations+=TslImportedDeclaration)* ','?
;

interface TslImportedDeclaration extends TslObject {
    declaration?: @TslModuleMember;
    alias?: TslImportedDeclarationAlias;
}

TslImportedDeclaration returns TslImportedDeclaration:
    declaration=[TslModuleMember:ID] alias=TslImportedDeclarationAlias?
;

interface TslImportedDeclarationAlias extends TslObject {
    alias: string;
}

TslImportedDeclarationAlias returns TslImportedDeclarationAlias:
    {TslImportedDeclarationAlias} 'as' alias=ID
;

interface TslWildcardImport extends TslImport {}

TslWildcardImport returns TslWildcardImport:
    'from'
    package=QualifiedName
    'import'
    '*'
;

QualifiedName returns string:
    ID ('.' ID)*
;


// -----------------------------------------------------------------------------
// Declarations
// -----------------------------------------------------------------------------

interface TslModuleMember extends TslDeclaration {}

TslModuleMember returns TslModuleMember:
    {TslFunction}
      TslFunctionFragment

    | {TslConstant}
      TslConstantFragment

    | {TslData}
      TslDataFragment
;

interface TslFunction extends TslCallable, TslModuleMember {
    isID: boolean
    result?: TslResult
    timeunit?: TslTimeunit
    groupedBy?: TslGroupedBy
    body: TslFunctionBlock
}

fragment TslFunctionFragment:
    (visibility=TslVisibility)?
    isID?='id'?
    'function'
    (timeunit=TslTimeunit)?
    name=ID
    parameterList=TslParameterList
    (result=TslResult)?
    (groupedBy=TslGroupedBy)?
    body=TslFunctionBlock
;

interface TslConstant extends TslModuleMember, TslDeclaration {
    timespanValueEntries?: TslTimespanValueEntry[]
    ^type: TslType[]
    value?: TslExpression
}

fragment TslConstantFragment:
    (visibility=TslVisibility)?
    'constant'
    name=ID
    (':' ^type+=TslType ('{' (timespanValueEntries+=TslTimespanValueEntry)* '}' |
    '=' value=TslExpression ';'?) | '{' ((timespanValueEntries+=TslTimespanValueEntry)* | (^type+=TslType '{' (timespanValueEntries+=TslTimespanValueEntry)* '}')*)'}')
    
;

interface TslData extends TslModuleMember, TslDeclaration {
    isID: boolean
    ^type: TslType
    timeunit?: TslTimeunit
    groupedBy?: TslGroupedBy
}

fragment TslDataFragment:
    (visibility=TslVisibility)?
    isID?='id'?
    'data'
    (timeunit=TslTimeunit)?
    name=ID
    ':' ^type=TslType
    (groupedBy=TslGroupedBy)? ';'?
;

// -----------------------------------------------------------------------------
// Callables, parameters, and results
// -----------------------------------------------------------------------------

interface TslCallable extends TslObject {
    parameterList?: TslParameterList
}

interface TslParameterList extends TslObject {
    parameters: TslParameter[]
}

TslParameterList returns TslParameterList:
    {TslParameterList}
    '('
    (
        parameters+=TslParameter
        (',' parameters+=TslParameter)*
        ','?
    )?
    ')'
;

interface TslParameter extends TslLocalVariable {
    isConstant: boolean
    defaultValue?: TslExpression
}

TslParameter returns TslParameter:
    isConstant?='constant'?
    name=ID
    ':' type=TslType
    ('=' defaultValue=TslExpression)?
;

interface TslResultList extends TslObject {
    results: TslResult[]
}


interface TslResult extends TslDeclaration {
    ^type?: TslType
}

TslResult returns TslResult:
    (name=ID )?
    ':' ^type=TslType
;


// -----------------------------------------------------------------------------
// Statements
// -----------------------------------------------------------------------------

interface TslStatement extends TslObject {}

interface TslBlock extends TslObject {
    statements: TslStatement[]
}

TslBlock returns TslBlock:
    {TslBlock} '{' statements+=TslStatement* '}'
;

interface TslFunctionBlock extends TslBlock{
    timespanStatement: TslTimespanStatement[]
}

TslFunctionBlock returns TslFunctionBlock:
    {TslFunctionBlock}
    '{' ( timespanStatement+=TslTimespanStatement
    | statements+=TslStatement)*
    '}'
;

TslStatement returns TslStatement:
    TslAssignment
  | TslExpressionStatement
  | TslConditionalStatement
  | TslLoop
  | TslReturnStatement
;

interface TslAssignment extends TslStatement {
    assignee: TslAssignee
    expression?: TslExpression
}

TslAssignment returns TslAssignment:
    assignee=TslAssignee '=' expression=TslExpression ';'?
;

interface TslAssignee extends TslObject {}

interface TslPlaceholder extends TslAssignee, TslLocalVariable {}

interface TslPlaceholderReference extends TslAssignee, TslReference{}

TslPlaceholderReference returns TslPlaceholderReference:
    target = [TslPlaceholder:ID]
;

TslAssignee returns TslAssignee:
    {TslPlaceholder} 'var' name=ID (':' ^type=TslType)?  (groupedBy=TslGroupedBy)?
    | TslPlaceholderReference
;

interface TslExpressionStatement extends TslStatement {
    expression: TslExpression
}

TslExpressionStatement returns TslExpressionStatement:
    expression=TslExpression ';'
;

interface TslConditionalStatement extends TslStatement{
    expression: TslExpression
    ifBlock: TslBlock
    elseBlock?: TslBlock
}

TslConditionalStatement returns TslConditionalStatement:
    'if''(' expression=TslExpression ')' ifBlock=TslBlock
    ('else' elseBlock=TslBlock)?
;

interface TslLoop extends TslStatement{
    block: TslBlock
}

TslLoop returns TslLoop:
    TslWhileLoop
    | TslForLoop
    | TslForeachLoop
;

interface TslWhileLoop extends TslLoop{
    condition: TslExpression
}

TslWhileLoop returns TslWhileLoop:
    'while''(' condition=TslExpression ')' block=TslBlock
;

interface TslForLoop extends TslLoop{
    definitionStatement?: TslStatement
    condition: TslExpression
    iteration?: TslStatement
}

TslForLoop returns TslForLoop:
    'for''(' (definitionStatement=TslAssignment| ';')
     condition=TslExpression
    ';' (iteration=TslAssignment)?
    ')' block=TslBlock
;

interface TslForeachLoop extends TslLoop{
    element: TslLocalVariable
    list: TslExpression
}

TslForeachLoop returns TslForeachLoop:
    'foreach''(' element=TslLocalVariable 'in' list=TslExpression ')'
    block=TslBlock
;

interface TslReturnStatement extends TslStatement{
    result: TslExpression
}

TslReturnStatement returns TslReturnStatement:
    'return' result=TslExpression ';'
;

// -----------------------------------------------------------------------------
// Expressions
// -----------------------------------------------------------------------------

interface TslExpression extends TslObject {}

TslExpression returns TslExpression:
    TslOrExpression | TslAggregation
;

interface TslAggregation extends TslExpression{
    function: TslString
    data: TslReference
    groupedBy: TslGroupedBy
}

TslAggregation returns TslAggregation:
    'aggregate' function=TslString 'of' data=TslReference groupedBy=TslGroupedBy
;

interface TslInfixOperation extends TslExpression {
    leftOperand: TslExpression
    operator: string
    rightOperand: TslExpression
}

interface TslPrefixOperation extends TslExpression {
    operand: TslExpression
    operator: string
}

TslOrExpression returns TslExpression:
    TslAndExpression
    (
        {TslInfixOperation.leftOperand=current}
        operator='or'
        rightOperand=TslAndExpression
    )*
;

TslAndExpression returns TslExpression:
    TslNotExpression
    (
        {TslInfixOperation.leftOperand=current}
        operator='and'
        rightOperand=TslNotExpression
    )*
;

TslNotExpression returns TslExpression:
    {TslPrefixOperation} operator='not' operand=TslNotExpression
  | TslEqualityExpression
;

TslEqualityExpression returns TslExpression:
    TslComparisonExpression
    (
        {TslInfixOperation.leftOperand=current}
        operator=TslEqualityOperator
        rightOperand=TslComparisonExpression
    )?
;

TslEqualityOperator returns string:
    '==' | '!=' | '===' | '!=='
;

TslComparisonExpression returns TslExpression:
    TslAdditiveExpression
    (
        {TslInfixOperation.leftOperand=current}
        operator=TslComparisonOperator
        rightOperand=TslAdditiveExpression
    )?
;

TslComparisonOperator returns string:
    '<' | '<=' | '>=' | '>'
;

TslAdditiveExpression returns TslExpression:
    TslMultiplicativeExpression
    (
        {TslInfixOperation.leftOperand=current}
        operator=TslAdditiveOperator
        rightOperand=TslMultiplicativeExpression
    )*
;

TslAdditiveOperator returns string:
    '+' | '-'
;

TslMultiplicativeExpression returns TslExpression:
    TslElvisExpression
    (
        {TslInfixOperation.leftOperand=current}
        operator=TslMultiplicativeOperator
        rightOperand=TslElvisExpression
    )*
;

TslMultiplicativeOperator returns string:
    '*' | '/'
;

TslElvisExpression returns TslExpression:
    TslTypeCast
    (
        {TslInfixOperation.leftOperand=current}
        operator='?:'
        rightOperand=TslTypeCast
    )*
;

interface TslTypeCast extends TslExpression {
    expression: TslExpression
    ^type: TslType
}

TslTypeCast returns TslExpression:
    TslUnaryOperation
    (
        {TslTypeCast.expression=current}
        'as'
        ^type=TslType
    )*
;

TslUnaryOperation returns TslExpression:
    {TslPrefixOperation} operator='-' operand=TslUnaryOperation
  | TslChainedExpression
;

interface TslChainedExpression extends TslExpression {
    receiver: TslExpression
    timeunit?: TslTimeunit
    isNullSafe: boolean
}

interface TslCall extends TslAbstractCall, TslChainedExpression {}

interface TslIndexedAccess extends TslChainedExpression {
    index: TslExpression
}

TslChainedExpression returns TslExpression:
    TslPrimaryExpression
    (
        {TslCall.receiver=current}
        (isNullSafe?='?')?
        (timeunit=TslTimeunit)?
        argumentList=TslCallArgumentList

    |   {TslIndexedAccess.receiver=current}
        (isNullSafe?='?')?
        '[' index=TslExpression ']'
    )*
;

interface TslArgumentList extends TslObject {
    arguments: TslArgument[]
}

TslCallArgumentList returns TslArgumentList:
    {TslArgumentList}
    '('
    (
        arguments+=TslCallArgument
        (',' arguments+=TslCallArgument)*
        ','?
    )?
    ')'
;

interface TslArgument extends TslExpression {
    parameter?: @TslParameter
    value: TslExpression
}

TslCallArgument returns TslArgument:
    (parameter=[TslParameter:ID] '=')? value=TslExpression
;

TslPrimaryExpression returns TslExpression:
    TslLiteral
  | TslReference
  | TslParenthesizedExpression
  | TslPredefinedFunction
;

interface TslLiteral extends TslExpression {}

TslLiteral returns TslLiteral:
    TslBoolean
  | TslFloat
  | TslInt
  | TslString
  | TslList
  | TslDictionary
  | TslNull
  | TslTemplateString
  | TslDate
;

interface TslBoolean extends TslLiteral {
    value: boolean
}

TslBoolean returns TslBoolean:
    value?='true'
  | {TslBoolean} 'false'
;

interface TslNumber extends TslLiteral {}

interface TslFloat extends TslNumber {
    value: number
}

TslFloat returns TslFloat:
    value=FLOAT
;

interface TslInt extends TslNumber {
    value: bigint
}

TslInt returns TslInt:
    value=INT
;

interface TslString extends TslNumber {
    value: string
}

TslString returns TslString:
    value=STRING
;

interface TslList extends TslLiteral {
    elements: TslExpression[]
}

TslList returns TslList:
    {TslList} '[' (elements+=TslExpression (',' elements+=TslExpression)* ','? )? ']'
;

interface TslDictionary extends TslLiteral {
    entries: TslDictionaryEntry[]
}

TslDictionary returns TslDictionary:
    {TslDictionary} '{' (entries+=TslDictionaryEntry (',' entries+=TslDictionaryEntry)* ','? )? '}'
;

interface TslDictionaryEntry extends TslObject {
    key: TslExpression
    value: TslExpression
}

TslDictionaryEntry returns TslDictionaryEntry:
    key=TslExpression ':' value=TslExpression
;

interface TslNull extends TslLiteral {}

TslNull returns TslNull:
    {TslNull} 'null'
;

interface TslDate extends TslLiteral{
    date: string
}

TslDate returns TslDate:
    date=DATE
;

interface TslParenthesizedExpression extends TslExpression {
    expression:TslExpression
}

TslParenthesizedExpression returns TslParenthesizedExpression:
    '(' expression=TslExpression  ')'
;

interface TslPredefinedFunction extends TslExpression {
    name: string
    object: TslReference
}

TslPredefinedFunction returns TslPredefinedFunction:
    name = ('len' | 'keys' | 'values') '(' object = TslReference ')'
;

interface TslReference extends TslExpression {
    target: @TslDeclaration
}

TslReference returns TslReference:
    target=[TslDeclaration:ID]
;

interface TslTemplateString extends TslExpression {
    expressions: TslExpression[]
}

TslTemplateString returns TslTemplateString:
    expressions+=TslTemplateStringStart
    expressions+=TslExpression?
    (expressions+=TslTemplateStringInner expressions+=TslExpression?)*
    expressions+=TslTemplateStringEnd
;

interface TslTemplateStringPart extends TslLiteral {
    value: string
}

interface TslTemplateStringStart extends TslTemplateStringPart {}

TslTemplateStringStart returns TslExpression:
    {TslTemplateStringStart}
    value=TEMPLATE_STRING_START
;

interface TslTemplateStringInner extends TslTemplateStringPart {}

TslTemplateStringInner returns TslExpression:
    {TslTemplateStringInner}
    value=TEMPLATE_STRING_INNER
;

interface TslTemplateStringEnd extends TslTemplateStringPart {}

TslTemplateStringEnd returns TslExpression:
    {TslTemplateStringEnd}
    value=TEMPLATE_STRING_END
;

// -----------------------------------------------------------------------------
// Modifier
// -----------------------------------------------------------------------------

interface TslModifier extends TslObject{}

interface TslVisibility extends TslModifier{
    isPublic?: boolean
    isPackageprivate?: boolean
    isPrivate?: boolean
}

TslVisibility returns TslVisibility:
    isPublic?='public' | isPackageprivate?='packageprivate' | isPrivate?='private'
;

interface TslTimeunit extends TslModifier{
    timeunit: string
}

TslTimeunit returns TslTimeunit:
    'per' timeunit=('day'|'week'|'month'|'year')
;

interface TslGroupedBy extends TslModifier{
    id: TslReference[]
}

TslGroupedBy returns TslGroupedBy:
    'groupedBy' id+=TslReference (',' id+=TslReference)*
;

// -----------------------------------------------------------------------------
// Timespan
// -----------------------------------------------------------------------------

interface TslTimespan extends TslObject{
    start?: TslDate
    end?: TslDate
}

TslTimespan returns TslTimespan:
    ('from' start=TslDate | 'to' end=TslDate | 'from' start=TslDate 'to' end=TslDate)
;

interface TslTimespanStatement extends TslBlock, TslStatement{
    timespan: TslTimespan
    block: TslFunctionBlock
}

TslTimespanStatement returns TslTimespanStatement:
    timespan=TslTimespan block=TslFunctionBlock 
;

interface TslTimespanValueEntry extends TslObject{
    timespan: TslTimespan
    value: TslExpression
    type?: TslType
}

TslTimespanValueEntry returns TslTimespanValueEntry:
    timespan=TslTimespan (':' type=TslType)? '=' value=TslExpression ';'
;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TslType extends TslObject {
    isNullable: boolean
}


TslType returns TslType:
    TslPrimaryType (isNullable?='?')?
;

TslPrimaryType returns TslType:
    TslIntType
  | TslFloatType
  | TslStringType
  | TslBooleanType
  | TslDictionaryType
  | TslListType
  | TslAnyType
  | TslNothingType
;

interface TslIntType extends TslType {}

TslIntType returns TslIntType:
    {TslIntType} "Int"
;

interface TslFloatType extends TslType {}

TslFloatType returns TslFloatType:
    {TslFloatType} "Float"
;

interface TslStringType extends TslType {}

TslStringType returns TslStringType:
    {TslStringType} "String"
;

interface TslBooleanType extends TslType {}

TslBooleanType returns TslBooleanType:
    {TslBooleanType} "Boolean"
;

interface TslDictionaryType extends TslType {
    typeParameterList:TslTypeParameterList
}

TslDictionaryType returns TslDictionaryType:
    'Dict' typeParameterList=TslTypeParameterList
;

interface TslListType extends TslType {
    typeParameterList:TslTypeParameterList
}

TslListType returns TslListType:
    'List' typeParameterList=TslTypeParameterList
;


interface TslTypeParameterList extends TslObject {
    typeParameters: TslTypeParameter[]
}

TslTypeParameterList returns TslTypeParameterList:
    {TslTypeParameterList}
    '<'
        (
            typeParameters+=TslTypeParameter
            (',' typeParameters+=TslTypeParameter)*
            ','?
        )?
    '>'
;

interface TslTypeParameter extends TslType {
    type: TslType
}

TslTypeParameter returns TslTypeParameter:
    type=TslType
;

interface TslAnyType extends TslType {}

TslAnyType returns TslAnyType:
    {TslAnyType} 'Any'
;

interface TslNothingType extends TslType {}

TslNothingType returns TslNothingType:
    {TslNothingType} 'Nothing'
;


// -----------------------------------------------------------------------------
// Terminals
// -----------------------------------------------------------------------------

terminal ID returns string: IDENTIFIER | '`' IDENTIFIER '`';
terminal fragment IDENTIFIER: /[_a-zA-Zäöüß][_a-zA-Zäöüß0-9]*/;

terminal FLOAT returns number
    : DECIMAL_DIGIT+ '.' DECIMAL_DIGIT+ FLOAT_EXPONENT?
    | DECIMAL_DIGIT+ FLOAT_EXPONENT;
terminal fragment DECIMAL_DIGIT: /[0-9]/;
terminal DATE returns string: /[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2})?/;
terminal fragment FLOAT_EXPONENT: ('e' | 'E' )('+' | '-' )? DECIMAL_DIGIT+;
terminal INT returns bigint: DECIMAL_DIGIT+;
terminal STRING returns string: STRING_START STRING_TEXT* STRING_END;
terminal fragment STRING_START: STRING_DELIMITER;
terminal fragment STRING_END: '{'? STRING_DELIMITER;
terminal fragment STRING_DELIMITER: '"';
terminal fragment STRING_TEXT
    : '{'? ESCAPE_SEQUENCE
    | OTHER_SEQUENCE
;
terminal fragment ESCAPE_SEQUENCE: '\\' .;
terminal fragment OTHER_SEQUENCE: /{?[^\\"{]/;
terminal fragment TEMPLATE_EXPRESSION_START: '{{';
terminal fragment TEMPLATE_EXPRESSION_END: '}}';
terminal TEMPLATE_STRING_START returns string: STRING_START STRING_TEXT* TEMPLATE_EXPRESSION_START;
terminal TEMPLATE_STRING_INNER returns string: TEMPLATE_EXPRESSION_END STRING_TEXT* TEMPLATE_EXPRESSION_START;
terminal TEMPLATE_STRING_END returns string: TEMPLATE_EXPRESSION_END STRING_TEXT* STRING_END;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\#[^\n\r]*/;
hidden terminal TEST_MARKER: /[»«]/;
hidden terminal WS: /\s+/;
