grammar TSL

// -----------------------------------------------------------------------------
// Base interfaces
// -----------------------------------------------------------------------------

interface TslObject {}

interface TslAnnotatedObject extends TslObject {
    annotationCalls?: TslAnnotationCall[]
}

interface TslAbstractCall extends TslObject {
    argumentList: TslArgumentList
}

interface TslDeclaration extends TslAnnotatedObject {
    annotationCallList?: TslAnnotationCallList
    name: string
}

interface TslLocalVariable extends TslDeclaration {
    groupedBy?: TslGroupedBy
    type: TslType
    value?: TslExpression
}

// -----------------------------------------------------------------------------
// Module
// -----------------------------------------------------------------------------

interface TslModule extends TslDeclaration {
    imports: TslImport[];
    members: TslAnnotatedObject[]
}

entry TslModule returns TslModule:
    {TslModule}
    annotationCalls+=TslAnnotationCall*
    (
        ('package' name=QualifiedName)
        imports+=TslImport*
        members+=(TslAnnotatedModuleMember | TslUnannotatedModuleMember)*

    |   imports+=TslImport+
        members+=(TslAnnotatedModuleMember | TslUnannotatedModuleMember)*

    |   members+=TslUnannotatedModuleMember
        members+=(TslAnnotatedModuleMember | TslUnannotatedModuleMember)*
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

interface TslModuleMember extends TslDeclaration {
    visibility?: TslVisibility
}

TslAnnotatedModuleMember returns TslModuleMember:
    {TslAnnotationCallList}
    annotationCalls+=TslAnnotationCall+
    (
        {TslAnnotation.annotationCallList=current}
        TslAnnotationFragment

      | {TslClass.annotationCallList=current}
        TslClassFragment

      | {TslEnum.annotationCallList=current}
        TslEnumFragment

      | {TslFunction.annotationCallList=current}
        TslFunctionFragment

      | {TslSchema.annotationCallList=current}
        TslSchemaFragment

      | {TslPipeline.annotationCallList=current}
        TslPipelineFragment

      | {TslSegment.annotationCallList=current}
        TslSegmentFragment
    )
;

TslUnannotatedModuleMember returns TslModuleMember:
      {TslAnnotation}
      TslAnnotationFragment

    | {TslClass}
      TslClassFragment

    | {TslEnum}
      TslEnumFragment

    | {TslFunction}
      TslFunctionFragment

    | {TslConstant}
      TslConstantFragment

    | {TslData}
      TslDataFragment

    | {TslSchema}
      TslSchemaFragment

    | {TslPipeline}
      TslPipelineFragment

    | {TslSegment}
      TslSegmentFragment
;

interface TslAnnotation extends TslCallable, TslModuleMember {
    constraintList?: TslConstraintList
}

fragment TslAnnotationFragment:
    'annotation' name=ID
    parameterList=TslParameterList?
    constraintList=TslConstraintList?
;

interface TslClass extends TslCallable, TslClassMember, TslModuleMember, TslNamedTypeDeclaration {
    typeParameterList?: TslTypeParameterList
    parentTypeList?: TslParentTypeList
    constraintList?: TslConstraintList
    body?: TslClassBody
}

fragment TslClassFragment:
    'class'
    name=ID
    typeParameterList=TslTypeParameterList?
    parameterList=TslParameterList?
    parentTypeList=TslParentTypeList?
    constraintList=TslConstraintList?
    body=TslClassBody?
;

interface TslParentTypeList extends TslObject {
    parentTypes: TslType[]
}

TslParentTypeList returns TslParentTypeList:
    'sub'
    parentTypes+=TslParentType
    (',' parentTypes+=TslParentType)*
    ','?
;

interface TslClassBody extends TslObject {
    members: TslClassMember[]
}

TslClassBody returns TslClassBody:
    {TslClassBody} '{' members+=TslClassMember* '}'
;

interface TslClassMember extends TslDeclaration {
    isStatic?: boolean
}

TslClassMember returns TslClassMember:
    TslAnnotatedClassMember
  | TslUnannotatedClassMember
;

TslAnnotatedClassMember returns TslClassMember:
    {TslAnnotationCallList}
    annotationCalls+=TslAnnotationCall+
    (
        {TslAttribute.annotationCallList=current}
        TslAttributeFragment

      | {TslClass.annotationCallList=current}
        TslClassFragment

      | {TslEnum.annotationCallList=current}
        TslEnumFragment

      | {TslFunction.annotationCallList=current}
        isStatic?='static'?
        TslFunctionFragment
    )
;

TslUnannotatedClassMember returns TslClassMember:
      {TslAttribute}
      TslAttributeFragment

    | {TslClass}
      TslClassFragment

    | {TslEnum}
      TslEnumFragment

    | {TslFunction}
      isStatic?='static'?
      TslFunctionFragment
;

interface TslAttribute extends TslClassMember {
    ^type?: TslType
}

fragment TslAttributeFragment:
    isStatic?='static'?
    'attr'
    name=ID
    (':' ^type=TslType)?
;


interface TslEnum extends TslNamedTypeDeclaration, TslClassMember, TslModuleMember {
    body?: TslEnumBody
}

fragment TslEnumFragment:
    'enum'
    name=ID
    body=TslEnumBody?
;

interface TslEnumBody extends TslObject {
    variants: TslEnumVariant[]
}

TslEnumBody returns TslEnumBody:
    {TslEnumBody} '{' variants+=TslEnumVariant * '}'
;

interface TslEnumVariant extends TslCallable, TslNamedTypeDeclaration {
    constraintList?: TslConstraintList
}

TslEnumVariant returns TslEnumVariant:
    annotationCalls+=TslAnnotationCall*
    name=ID
    parameterList=TslParameterList?
    constraintList=TslConstraintList?
;

interface TslFunction extends TslCallable, TslClassMember, TslModuleMember {
    isID: boolean
    typeParameterList?: TslTypeParameter[]
    resulttype?: TslType
    timeunit?: TslTimeunit
    groupedBy?: TslGroupedBy
    constraintList?: TslConstraintList
    body: TslFunctionBlock
}

fragment TslFunctionFragment:
    (visibility=TslVisibility)?
    isID?='id'?
    'function'
    (timeunit=TslTimeunit)?
    name=ID
    (functParameterList+=TslParameter ':'
    typeParameterList+=TslTypeParameter)*
    ':' resulttype=TslType?
    (groupedBy=TslGroupedBy)?
    constraintList=TslConstraintList?
    body=TslFunctionBlock
;

interface TslFunctionBlock extends TslBlock{
    timespanStatement: TslTimespanStatement[]
    returnValue?: TslExpression
}

TslFunctionBlock returns TslFunctionBlock:
    {TslFunctionBlock}
    '{' ( timespanStatement+=TslTimespanStatement
    | statements+=TslStatement)*
    ('returns' returnValue=TslExpression)?
    '}'
;

interface TslConstant extends TslModuleMember, TslDeclaration {
    timespanValueEntries?: TslTimespanValueEntry[]
    ^type: TslType
    value?: TslExpression
}

fragment TslConstantFragment:
    (visibility=TslVisibility)?
    'constant'
    name=ID
    ':' ^type=TslType
    ('{' (timespanValueEntries+=TslTimespanValueEntry)* '}' |
    '=' value=TslExpression) ';'?
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

interface TslPipeline extends TslModuleMember {
    body: TslBlock
}

fragment TslPipelineFragment:
    'pipeline'
    name=ID
    body=TslBlock
;

interface TslSegment extends TslCallable, TslModuleMember {
    resultList?: TslResultList
    constraintList?: TslConstraintList
    body: TslBlock
}

fragment TslSegmentFragment:
    'segment'
    name=ID
    parameterList=TslParameterList
    resultList=TslResultList?
    constraintList=TslConstraintList?
    body=TslBlock
;


// -----------------------------------------------------------------------------
// Annotation calls
// -----------------------------------------------------------------------------

interface TslAnnotationCallList extends TslAnnotatedObject {}

interface TslAnnotationCall extends TslAbstractCall {
    annotation?: @TslAnnotation
}

TslAnnotationCall returns TslAnnotationCall:
    '@' annotation=[TslAnnotation:ID] argumentList=TslAnnotationCallArgumentList?
;

TslAnnotationCallArgumentList returns TslArgumentList:
    {TslArgumentList} '(' (arguments+=TslAnnotationCallArgument  (',' arguments+=TslAnnotationCallArgument)* ','? )? ')'
;

TslAnnotationCallArgument returns TslArgument:
    (parameter=[TslParameter:ID ] '=')? value=TslExpression
;


// -----------------------------------------------------------------------------
// Constraints
// -----------------------------------------------------------------------------

interface TslConstraintList extends TslObject {
    constraints: TslConstraint[]
}

TslConstraintList returns TslConstraintList:
    'where'
    '{'
    (
        constraints+=TslConstraint
        (',' constraints+=TslConstraint)*
        ','?
    )?
    '}'
;

interface TslConstraint extends TslObject {}

TslConstraint returns TslConstraint:
    TslParameterBound
;

interface TslParameterBound extends TslConstraint {
    leftOperand?: @TslParameter
    operator: string
    rightOperand: TslExpression
}

TslParameterBound returns TslParameterBound:
    leftOperand=[TslParameter:ID]
    operator=TslComparisonOperator
    rightOperand=TslExpression
;


// -----------------------------------------------------------------------------
// Callables, parameters, and results
// -----------------------------------------------------------------------------

interface TslCallable extends TslObject {
    parameterList?: TslParameterList
    functParameterList?: TslParameter[]
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
    annotationCalls+=TslAnnotationCall*
    isConstant?='constant'?
    name=ID
    (':' ^type=TslType)?
    ('=' defaultValue=TslExpression)?
;

interface TslResultList extends TslObject {
    results: TslResult[]
}

TslResultList returns TslResultList:
    {TslResultList} ':' results+=TslResult
  | {TslResultList} ':' '(' (results+=TslResult (',' results+=TslResult)* ','? )? ')'
;

interface TslAbstractResult extends TslDeclaration {}

interface TslResult extends TslAbstractResult {
    ^type?: TslType
}

TslResult returns TslResult:
    annotationCalls+=TslAnnotationCall*
    name=ID
    (':' ^type=TslType)?
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

TslStatement returns TslStatement:
    TslAssignment
  | TslExpressionStatement
  | TslConditionalStatement
  | TslLoop
;

interface TslAssignment extends TslStatement {
    assigneeList?: TslAssigneeList
    expression?: TslExpression
}

TslAssignment returns TslAssignment:
    assigneeList=TslAssigneeList '=' expression=TslExpression ';'
;

interface TslAssigneeList extends TslObject {
    assignees: TslAssignee[]
}

TslAssigneeList returns TslAssigneeList:
    assignees+=TslAssignee  (',' assignees+=TslAssignee)* ','?
;

interface TslAssignee extends TslObject {}

interface TslPlaceholder extends TslAssignee, TslLocalVariable {}

interface TslWildcard extends TslAssignee {}

interface TslYield extends TslAssignee {
    result?: @TslResult
}

TslAssignee returns TslAssignee:
    {TslPlaceholder} 'var' name=ID ':' type=TslType (groupedBy=TslGroupedBy)?
  | {TslWildcard} '_'
  | {TslYield} 'yield' result=[TslResult:ID]
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
    'for''(' (definitionStatement=TslStatement)?
    ';' condition=TslExpression
    ';' (iteration=TslStatement)?
    ')' block=TslBlock
;

interface TslForeachLoop extends TslLoop{
    element: string
    list: TslExpression
}

TslForeachLoop returns TslForeachLoop:
    'foreach''(' element=STRING 'in' list=TslExpression ')'
    block=TslBlock
;

// -----------------------------------------------------------------------------
// Expressions
// -----------------------------------------------------------------------------

interface TslExpression extends TslObject {}

TslExpression returns TslExpression:
    TslLambda | TslOrExpression | TslAggregation
;

interface TslAggregation extends TslExpression{
    function: @TslFunction
    data: @TslData[]
    groupedBy: TslGroupedBy
}

TslAggregation returns TslAggregation:
    'aggregate' function=[TslFunction:ID] 'of' data+=[TslData:ID] (',' data+=[TslData:ID])* groupedBy=TslGroupedBy
;

interface TslLambda extends TslCallable, TslExpression {}

interface TslBlockLambda extends TslLambda {
    body: TslBlock
}

interface TslExpressionLambda extends TslLambda {
    result: TslExpression
}

TslLambda returns TslExpression:
    TslParameterList
    (
      {TslBlockLambda.parameterList=current} body=TslBlockLambdaBlock
    | {TslExpressionLambda.parameterList=current} '->' result=TslExpression
    )
;

TslBlockLambdaBlock returns TslBlock:
    {TslBlock} '{' statements+=TslBlockLambdaStatement* '}'
;

TslBlockLambdaStatement returns TslStatement:
    TslBlockLambdaAssignment | TslExpressionStatement
;

TslBlockLambdaAssignment returns TslAssignment:
    assigneeList=TslBlockLambdaAssigneeList  '=' expression=TslExpression  ';'
;

TslBlockLambdaAssigneeList returns TslAssigneeList:
    assignees+=TslBlockLambdaAssignee  (',' assignees+=TslBlockLambdaAssignee)* ','?
;

interface TslBlockLambdaResult extends TslAssignee, TslAbstractResult {}

TslBlockLambdaAssignee returns TslAssignee:
    {TslWildcard} '_'
  | {TslPlaceholder} 'var' name=ID ':' type=TslType (groupedBy=TslGroupedBy)?
  | {TslBlockLambdaResult} 'yield' name=ID
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
    isNullSafe: boolean
}

interface TslCall extends TslAbstractCall, TslChainedExpression {}

interface TslIndexedAccess extends TslChainedExpression {
    index: TslExpression
}

interface TslMemberAccess extends TslChainedExpression {
    member?: TslReference
}

TslChainedExpression returns TslExpression:
    TslPrimaryExpression
    (
        {TslCall.receiver=current}
        (isNullSafe?='?')?
        argumentList=TslCallArgumentList

    |   {TslIndexedAccess.receiver=current}
        (isNullSafe?='?')?
        '[' index=TslExpression ']'

    |   {TslMemberAccess.receiver=current}
        (isNullSafe?='?')?
        '.'
        member=TslReference
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
  | TslParenthesizedExpression
  | TslReference
  | TslTemplateString
;

interface TslLiteral extends TslExpression {}

TslLiteral returns TslLiteral:
    TslBoolean
  | TslFloat
  | TslInt
  | TslList
  | TslDictionary
  | TslNull
  | TslString
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

interface TslString extends TslLiteral {
    value: string
}

TslString returns TslString:
    value=STRING
;

interface TslDate extends TslLiteral{
    date: Date
}

TslDate returns TslDate:
    date=DATE
;


interface TslParenthesizedExpression extends TslExpression {
    expression: TslExpression
}

TslParenthesizedExpression returns TslParenthesizedExpression:
    '(' expression=TslExpression  ')'
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
    isPublic?='public'? | isPackageprivate?='packageprivate'? | isPrivate?='private'?
;

interface TslTimeunit extends TslModifier{
    timeunit: string
}

TslTimeunit returns TslTimeunit:
    'per' timeunit=('day'|'week'|'month'|'year')
;

interface TslGroupedBy extends TslModifier{
    id: TslExpression
}

TslGroupedBy returns TslGroupedBy:
    'groupedBy' id=TslExpression
;

// -----------------------------------------------------------------------------
// Timespan
// -----------------------------------------------------------------------------

interface TslTimespan extends TslObject{
    start?: TslDate
    end?: TslDate
}

TslTimespan returns TslTimespan:
    ('from' start=TslDate)? ('to' end=TslDate)?
;

interface TslTimespanStatement extends TslBlock, TslStatement{
    timespan: TslTimespan
    block: TslFunctionBlock
}

TslTimespanStatement returns TslTimespanStatement:
    timespan=TslTimespan '{' block=TslFunctionBlock '}'
;

interface TslTimespanValueEntry extends TslObject{
    timespan: TslTimespan
    value: TslExpression
}

TslTimespanValueEntry returns TslTimespanValueEntry:
    timespan=TslTimespan '=' value=TslExpression
;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TslType extends TslObject {}

interface TslNamedTypeDeclaration extends TslDeclaration {}

interface TslMemberType extends TslType {
    receiver: TslType
    member?: TslNamedType
}

TslType returns TslType:
    TslPrimaryType ({TslMemberType.receiver=current} '.' member=TslNamedType)*
;

TslPrimaryType returns TslType:
    TslCallableType
  | TslLiteralType
  | TslNamedType
  | TslUnionType
  | 'Int'
  | 'String'
  | 'Boolean'
  | 'Dict'
  | 'List'
;

interface TslCallableType extends TslCallable, TslType {
    resultList: TslResultList
}

TslCallableType returns TslCallableType:
    parameterList=TslParameterList
    resultList=TslResultList
;

interface TslLiteralType extends TslType {
    literalList: TslLiteralList
}

TslLiteralType returns TslLiteralType:
    'literal' literalList=TslLiteralList
;

interface TslLiteralList extends TslObject {
    literals: TslLiteral[]
}

TslLiteralList returns TslLiteralList:
    {TslLiteralList}
    '<'
    (
        literals+=TslLiteral
        (',' literals+=TslLiteral)*
        ','?
    )?
    '>'
;

interface TslNamedType extends TslType {
    declaration?: @TslNamedTypeDeclaration
    typeArgumentList?: TslTypeArgumentList
    isNullable: boolean
}

TslNamedType returns TslNamedType:
    declaration=[TslNamedTypeDeclaration:ID]
    typeArgumentList=TslTypeArgumentList?
    (isNullable?='?' )?
;

interface TslUnionType extends TslType {
    typeArgumentList: TslTypeArgumentList
}

TslUnionType returns TslUnionType:
    'union' typeArgumentList=TslUnionTypeArgumentList
;

TslUnionTypeArgumentList returns TslTypeArgumentList:
    {TslTypeArgumentList}
    '<'
    (
        typeArguments+=TslUnionTypeArgument
        (',' typeArguments+=TslUnionTypeArgument)*
        ','?
    )?
    '>'
;

TslUnionTypeArgument returns TslTypeArgument:
    value=TslType
;

TslParentType returns TslType:
    TslNamedType ({TslMemberType.receiver=current} '.' member=TslNamedType)*
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

interface TslTypeParameter extends TslNamedTypeDeclaration {
    variance?: string
    upperBound?: TslType
    defaultValue?: TslType
}

TslTypeParameter returns TslTypeParameter:
    annotationCalls+=TslAnnotationCall*
    variance=TslTypeParameterVariance?
    name=ID
    ('sub' upperBound=TslType)?
    ('=' defaultValue=TslType)?
;

TslTypeParameterVariance returns string:
    'in' | 'out'
;

interface TslTypeArgumentList extends TslObject {
    typeArguments: TslTypeArgument[]
}

TslTypeArgumentList returns TslTypeArgumentList:
    {TslTypeArgumentList}
    '<'
    (typeArguments+=TslTypeArgument (',' typeArguments+=TslTypeArgument)* ','? )?
    '>'
;

interface TslTypeArgument extends TslObject {
    typeParameter?: @TslTypeParameter
    value: TslType
}

TslTypeArgument returns TslTypeArgument:
    (typeParameter=[TslTypeParameter:ID] '=' )?
    value=TslType
;


// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

interface TslSchema extends TslModuleMember {
    columnList: TslColumnList
}

fragment TslSchemaFragment:
    'schema'
    name=ID
    columnList=TslColumnList
;

interface TslColumnList extends TslObject {
    columns: TslColumn[]
}

TslColumnList returns TslColumnList:
    {TslColumnList} '{' (columns+=TslColumn  (',' columns+=TslColumn)* ','? )? '}'
;

interface TslColumn extends TslObject {
    columnName: TslString
    columnType: TslType
}

TslColumn returns TslColumn:
    columnName=TslString ":" columnType=TslType
;


// -----------------------------------------------------------------------------
// Terminals
// -----------------------------------------------------------------------------

terminal ID returns string: IDENTIFIER | '`' IDENTIFIER '`';
terminal fragment IDENTIFIER: /[_a-zA-Z][_a-zA-Z0-9]*/;

terminal FLOAT returns number
    : DECIMAL_DIGIT+ '.' DECIMAL_DIGIT+ FLOAT_EXPONENT?
    | DECIMAL_DIGIT+ FLOAT_EXPONENT;
terminal fragment DECIMAL_DIGIT: /[0-9]/;
terminal DATE returns Date: /[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2})?/;
terminal fragment FLOAT_EXPONENT: ('e' | 'E' )('+' | '-' )? DECIMAL_DIGIT+;
terminal INT returns bigint: DECIMAL_DIGIT+;
terminal STRING returns string: STRING_START STRING_TEXT* STRING_END;
terminal fragment STRING_START: STRING_DELIMITER;
terminal fragment STRING_END: '{'? STRING_DELIMITER;
terminal fragment STRING_DELIMITER: '"';
terminal fragment STRING_TEXT
    : '{'? ESCAPE_SEQUENCE
    | /{?[^\\"{]/
;
terminal fragment ESCAPE_SEQUENCE: '\\' .;
terminal fragment TEMPLATE_EXPRESSION_START: '{{';
terminal fragment TEMPLATE_EXPRESSION_END: '}}';
terminal TEMPLATE_STRING_START returns string: STRING_START STRING_TEXT* TEMPLATE_EXPRESSION_START;
terminal TEMPLATE_STRING_INNER returns string: TEMPLATE_EXPRESSION_END STRING_TEXT* TEMPLATE_EXPRESSION_START;
terminal TEMPLATE_STRING_END returns string: TEMPLATE_EXPRESSION_END STRING_TEXT* STRING_END;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
hidden terminal TEST_MARKER: /[»«]/;
hidden terminal WS: /\s+/;
