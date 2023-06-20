import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { Context } from "../context";

const checkAuth = (context: Context): number => {
  const { userId } = context;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
};

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("description");
    t.nonNull.string("url");
    t.field("postedBy", {
      type: "User",
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .postedBy();
      },
    });
  },
});

export const LinkQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("feed", {
      type: "Link",
      resolve(parent, args, context, info) {
        checkAuth(context);

        return context.prisma.link.findMany();
      },
    });

    t.field("entry", {
      type: "Link",
      description: "A single entry",
      args: {
        linkId: nonNull(
          intArg({
            description: 'LinkID"',
          })
        ),
      },
      resolve(parent, args, context) {
        checkAuth(context);

        const link = context.prisma.link.findUnique({
          where: {
            id: args.linkId,
          },
        });

        return link;
      },
    });
  },
});

export const LinkMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("post", {
      type: "Link",
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        const userId = checkAuth(context);

        const { description, url } = args;

        const newLink = context.prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } },
          },
        });

        return newLink;
      },
    });

    t.nonNull.field("update", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
        description: stringArg(),
        url: stringArg(),
      },

      resolve(parent, args, context) {
        checkAuth(context);

        const { id, description, url } = args;

        const link = context.prisma.link.update({
          where: {
            id,
          },
          data: {
            description: description || undefined,
            url: url || undefined,
          },
        });

        return link;
      },
    });

    t.nonNull.field("delete", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
      },

      resolve(parent, args, context) {
        checkAuth(context);

        const { id } = args;

        const deletedLink = context.prisma.link.delete({
          where: {
            id,
          },
        });

        return deletedLink;
      },
    });
  },
});
