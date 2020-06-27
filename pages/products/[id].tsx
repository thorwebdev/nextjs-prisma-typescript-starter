import Link from 'next/link';
import { useRouter } from 'next/router';
import { PrismaClient, Product, Sku, Attribute, Price } from '@prisma/client';

const prisma = new PrismaClient();

export async function getStaticPaths() {
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ name: 'Featured' }, { name: 'Sale' }],
    },
    include: {
      products: true,
    },
  });
  const products = [...categories[0].products, ...categories[1].products];
  const paths = products.map((product) => ({
    params: { id: `${product.id}` },
  }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({
  params,
}: {
  params: {
    id: number;
  };
}) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) throw new Error('Id is NaN');
    const product = await prisma.product.findOne({
      where: { id },
      include: {
        variants: { include: { attributes: true, prices: true } },
      },
    });
    return { props: { product } };
  } catch (error) {
    console.log(error.message);
    return { props: { product: null, error: error.message } };
  }
}

export default function ProductPage({
  product,
  error,
}: {
  product:
    | (Product & {
        variants: (Sku & {
          attributes: Attribute[];
          prices: Price[];
        })[];
      })
    | null;
  error: any;
}) {
  const router = useRouter();

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return (
      <pre>
        {JSON.stringify(
          {
            product,
            error,
          },
          null,
          2
        )}
      </pre>
    );
  }

  return (
    <>
      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>
        {' | '}
        <Link href="/products">
          <a>All products</a>
        </Link>
      </nav>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <pre>{JSON.stringify(product, null, 2)}</pre>
    </>
  );
}
