import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { htdAPI, Candidate } from '../../../services/htdAPI';
import { getErrorMessage } from '../../../lib/utils';

const CandidatesList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;


  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await htdAPI.getCandidates({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        skill: skillFilter || undefined,
      });
      setCandidates(response?.candidates || []);
      setTotalPages(response?.totalPages || 1);
      setTotalItems(response?.totalCandidates || 0);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to fetch candidates');
      console.error('Error fetching candidates:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, skillFilter, itemsPerPage]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);


  console.log('Candidates state:', candidates);
  console.log('Loading state:', loading);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await htdAPI.deleteCandidate(id);
        toast.success('Candidate deleted successfully');
        fetchCandidates();
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to delete candidate');
        console.error('Error deleting candidate:', error);
        toast.error(errorMessage);
      }
    }
  }, [fetchCandidates]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCandidates();
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSkillFilter("");
    setCurrentPage(1);
    fetchCandidates();
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "IN_TRAINING":
        return "bg-blue-100 text-blue-800";
      case "DEPLOYED":
        return "bg-purple-100 text-purple-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "TERMINATED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
    fetchCandidates();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Candidates</h2>
        <Button asChild>
          <Link to="/htd/candidates/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Add Candidate
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or email..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 pl-8"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by skill..."
              className="pl-8 w-full md:w-[300px]"
              value={skillFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillFilter(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out flex-1"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition duration-300 ease-in-out"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading candidates...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <p className="text-gray-500 text-lg">No candidates found.</p>
          <p className="text-gray-400 mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {candidate.highestQualification}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {candidate.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {candidate.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          candidate?.status
                        )}`}
                      >
                        {candidate?.status?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>IT: {candidate?.totalITExperience ?? 0} years</div>
                      <div>Non-IT: {candidate?.totalNonITExperience ?? 0} years</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate?.skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 mr-1 mb-1">
                            {skill?.name || 'Unnamed Skill'}
                          </span>
                        ))}
                        {candidate?.skills && candidate.skills.length > 3 && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                        {(!candidate?.skills || candidate.skills.length === 0) && (
                          <span className="text-xs text-gray-500">No skills</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/htd/candidates/${candidate._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/htd/candidates/${candidate._id}/edit`)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(candidate._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                  </span>
                  {" "}-{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === page
                            ? "bg-blue-50 text-blue-600 z-10"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;
