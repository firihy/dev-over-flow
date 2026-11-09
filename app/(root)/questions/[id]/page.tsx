// Placeholder until questions can be loaded: shows the id from the URL
const QuestionDetails = async ({ params }: PageProps<"/questions/[id]">) => {
  const { id } = await params;

  return <h1 className="h1-bold text-dark100_light900">Question: {id}</h1>;
};

export default QuestionDetails;
