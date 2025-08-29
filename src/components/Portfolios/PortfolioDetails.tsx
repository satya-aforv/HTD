// 4. PortfolioDetails component - src/components/Portfolio/PortfolioDetails.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { portfolioAPI } from '../../services/portfolioAPI';

const PortfolioDetails: React.FC = () => {
  const { id } = useParams();
  const [portfolio, setPortfolio] = React.useState<any>(null);

  React.useEffect(() => {
    if (id) {
      portfolioAPI.getPortfolio(id).then(({ data }) => setPortfolio(data));
    }
  }, [id]);

  if (!portfolio) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{portfolio.name}</h1>
      <p className="text-gray-700 mb-4">{portfolio.description}</p>
      <Link to={`/portfolios/${portfolio._id}/edit`} className="bg-blue-500 text-white px-4 py-2 rounded">Edit</Link>
    </div>
  );
};

export default PortfolioDetails;
