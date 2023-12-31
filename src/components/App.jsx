import { Component } from 'react';
import { fetchImages } from 'api-service';
import Searchbar from './Searchbar';
import ImageGallery from './ImageGallery';
import Button from './Button';
import Loader from './Loader';
import { Container } from './App.styled';
import Modal from './Modal/Modal';
import PropTypes from 'prop-types';

class App extends Component {
  static propTypes = {
    searchQuery: PropTypes.string,
    page: PropTypes.number,
    images: PropTypes.array,
    isLoading: PropTypes.bool,
    isShowBtn: PropTypes.bool,
    isEmpty: PropTypes.bool,
    error: PropTypes.string,
    isModalOpen: PropTypes.bool,
    modalImage: PropTypes.object,
  };

  abortCtrl;

  state = {
    searchQuery: '',
    page: 1,
    images: [],
    isLoading: false,
    isShowBtn: false,
    isEmpty: false,
    error: null,
    isModalOpen: false,
    modalImage: {},
  };

  async componentDidUpdate(_, prevState) {
    const { searchQuery, page } = this.state;
    if (prevState.searchQuery !== searchQuery || prevState.page !== page) {
      this.getImages(this.state).then(() => {
        setTimeout(() => this.onLoadmoreScroll(), 100);
      });
    }
  }

  getImages = async ({ searchQuery, page }) => {
    try {
      if (this.abortCtrl) {
        this.abortCtrl.abort();
      }
      this.abortCtrl = new AbortController();
      this.setState({ isLoading: true });
      const response = await fetchImages(searchQuery, page, this.abortCtrl);
      const {
        data: { hits, totalHits },
        config: {
          params: { page: currentPage, per_page },
        },
      } = response;

      const buttonState = currentPage < Math.ceil(totalHits / per_page);
      this.imagesToState(hits, buttonState);
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  imagesToState = (images, buttonState) => {
    if (!images.length) {
      this.setState({ isEmpty: true });
      return;
    }

    this.setState(prevState => ({
      images: [...prevState.images, ...images],
      isShowBtn: buttonState,
    }));
  };

  handleSearchSubmit = ({ query }) => {
    if (this.state.searchQuery === query) {
      return;
    }

    this.setState({
      searchQuery: query,
      page: 1,
      images: [],
      isLoading: false,
      isShowBtn: false,
      isEmpty: false,
      error: null,
      modalImage: {},
    });
  };

  handleClickBtnLoadmore = () =>
    this.setState(prevState => ({ page: prevState.page + 1 }));

  openModal = (link, tags) => {
    this.setState({
      isModalOpen: true,
      modalImage: { imageURL: link, alt: tags },
    });
  };

  closeModal = () => this.setState({ isModalOpen: false });

  onLoadmoreScroll = () => {
    window.scrollBy({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  render() {
    const {
      images,
      error,
      isEmpty,
      isLoading,
      isShowBtn,
      isModalOpen,
      modalImage,
    } = this.state;
    return (
      <>
        <Container>
          <Searchbar onSubmit={this.handleSearchSubmit} />
          <main>
            <ImageGallery images={images} onClickImage={this.openModal} />
            {isEmpty && (
              <p style={{ textAlign: 'center' }}>
                Sorry. There are no images ... 😭
              </p>
            )}
            {isShowBtn && <Button onClick={this.handleClickBtnLoadmore} />}
            {isLoading && <Loader />}
            {error && (
              <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>
            )}
            <Modal
              isOpen={isModalOpen}
              onCloseModal={this.closeModal}
              image={modalImage}
            />
          </main>
        </Container>
      </>
    );
  }
}
export default App;
