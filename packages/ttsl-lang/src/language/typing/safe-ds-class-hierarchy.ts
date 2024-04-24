import { AstUtils, EMPTY_STREAM, stream, Stream } from 'langium';
import { SafeDsClasses } from '../builtins/safe-ds-classes.js';
import { isTslClass, isTslNamedType, TslClass, type TslClassMember } from '../generated/ast.js';
import { getClassMembers, getParentTypes, isStatic } from '../helpers/nodeProperties.js';
import { SafeDsServices } from '../safe-ds-module.js';

export class SafeDsClassHierarchy {
    private readonly builtinClasses: SafeDsClasses;

    constructor(services: SafeDsServices) {
        this.builtinClasses = services.builtins.Classes;
    }

    /**
     * Returns `true` if the given node is equal to or a subclass of the given other node. If one of the nodes is
     * `undefined`, `false` is returned.
     */
    isEqualToOrSubclassOf(node: TslClass | undefined, other: TslClass | undefined): boolean {
        if (!node || !other) {
            return false;
        }

        // Nothing is a subclass of everything
        if (node === this.builtinClasses.Nothing) {
            return true;
        }

        return node === other || this.streamProperSuperclasses(node).includes(other);
    }

    /**
     * Returns a stream of all superclasses of the given class. Direct ancestors are returned first, followed by their
     * ancestors and so on. The class itself is not included in the stream unless there is a cycle in the inheritance
     * hierarchy.
     */
    streamProperSuperclasses(node: TslClass | undefined): Stream<TslClass> {
        if (!node) {
            return EMPTY_STREAM;
        }

        return stream(this.properSuperclassesGenerator(node));
    }

    private *properSuperclassesGenerator(node: TslClass): Generator<TslClass, void> {
        const visited = new Set<TslClass>();
        let current = this.parentClass(node);
        while (current && !visited.has(current)) {
            yield current;
            visited.add(current);
            current = this.parentClass(current);
        }

        const anyClass = this.builtinClasses.Any;
        if (anyClass && node !== anyClass && !visited.has(anyClass)) {
            yield anyClass;
        }
    }

    streamSuperclassMembers(node: TslClass | undefined): Stream<TslClassMember> {
        if (!node) {
            return EMPTY_STREAM;
        }

        return this.streamProperSuperclasses(node).flatMap(getClassMembers);
    }

    /**
     * Returns the parent class of the given class, or undefined if there is no parent class. Only the first parent
     * type is considered, i.e. multiple inheritance is not supported.
     */
    private parentClass(node: TslClass | undefined): TslClass | undefined {
        const [firstParentType] = getParentTypes(node);
        if (isTslNamedType(firstParentType)) {
            const declaration = firstParentType.declaration?.ref;
            if (isTslClass(declaration)) {
                return declaration;
            }
        }

        return undefined;
    }

    /**
     * Returns the member that is overridden by the given member, or `undefined` if the member does not override
     * anything.
     */
    getOverriddenMember(node: TslClassMember | undefined): TslClassMember | undefined {
        // Static members cannot override anything
        if (!node || isStatic(node)) {
            return undefined;
        }

        // Don't consider members with the same name as a previous member
        const containingClass = AstUtils.getContainerOfType(node, isTslClass);
        if (!containingClass) {
            return undefined;
        }
        const firstMemberWithSameName = getClassMembers(containingClass).find(
            (it) => !isStatic(it) && it.name === node.name,
        );
        if (firstMemberWithSameName !== node) {
            return undefined;
        }

        return this.streamSuperclassMembers(containingClass)
            .filter((it) => !isStatic(it) && it.name === node.name)
            .head();
    }
}
