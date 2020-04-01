import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AdvancedSearchQuery } from '../models/AdvancedSearch';
import { UserForm } from '../models/User';
import { PasswordRecoveryResponse } from '../models/HttpResponse';

// This will only be set in development mode.  Production runs everything on the same domain.
export const baseURL = process.env.REACT_APP_QSA_PUBLIC_URL || '';

const searchUrl = `${baseURL}/api/advanced_search`;
const fetchUrl = `${baseURL}/api/fetch`;
const contextUrl = `${baseURL}/api/fetch_context`;
const loginUrl = `${baseURL}/api/authenticate`;
const logoutUrl = `${baseURL}/api/logout`;
const loggedInUserUrl = `${baseURL}/api/logged_in_user`;
const registerUrl = `${baseURL}/api/users`;
const updateContactDetailsUrl = `${baseURL}/api/users/update`;
const updatePasswordUrl = `${baseURL}/api/users/update_password`;
const recoveryTokenUrl = `${baseURL}/api/generate_token`;
const recoveryTokenPasswordUrl = `${baseURL}/api/token_update_password`;
const userUrl = `${baseURL}/api/admin/user`;
const usersUrl = `${baseURL}/api/admin/users`;
const becomeUserUrl = `${baseURL}/api/admin/become_user`;
const cartUrl = `${baseURL}/api/users/cart`;
const addToCartUrl = `${baseURL}/api/users/cart/add_item`;
const updateCartItemsUrl = `${baseURL}/api/users/cart/update_items`;
const removeFromCartUrl = `${baseURL}/api/users/cart/remove_item`;
const submitReadingRoomRequestsUrl = `${baseURL}/api/users/cart/create_reading_room_requests`;
const userRequestsUrl = `${baseURL}/api/users/requests`;
const userGetRequestUrl = `${baseURL}/api/users/requests/`;
const cancelRequestUrl = `${baseURL}/api/users/requests/cancel`;
const updateRequestDateRequiredUrl = `${baseURL}/api/users/requests/update`;
const clearCartUrl = `${baseURL}/api/users/cart/clear`;
const submitDigitalQuoteUrl = `${baseURL}/api/users/cart/create_digital_copy_quote_requests`;
const reorderOpenRequestsUrl = `${baseURL}/api/users/cart/reorder_open_request`;
const digitalCopyPricingUrl = `${baseURL}/api/digital_copy_pricing`;
const submitOrderUrl = `${baseURL}/api/submit_order`;
const getTagsUrl = `${baseURL}/api/tags`;
const addTagUrl = `${baseURL}/api/tags`;
const flagTagUrl = `${baseURL}/api/tags/flag`;
const getFlaggedTagsUrl = `${baseURL}/api/tags/flagged`;
const moderateTagUrl = `${baseURL}/api/tags/moderate`;
const getBannedTagsUrl = `${baseURL}/api/tags/banned`;
const addToBannedTagsUrl = `${baseURL}/api/tags/add-to-banned`;
const removeFromBannedTagsUrl = `${baseURL}/api/tags/remove-from-banned`;
const getPreviewTagUrl = `${baseURL}/api/tags/preview`;
const verifyCaptchaUrl = `${baseURL}/api/verify-captcha`;
const isCaptchaVerifiedUrl = `${baseURL}/api/captcha-verified`;
const listPagesUrl = `${baseURL}/api/admin/pages`;
const getPageContentUrl = `${baseURL}/api/admin/page`;
const savePageUrl = `${baseURL}/api/admin/pages`;
const deletePageUrl = `${baseURL}/api/admin/pages/delete`;
const restorePageUrl = `${baseURL}/api/admin/pages/restore`;
const savedSearchesAllUrl = `${baseURL}/api/saved_searches`;
const savedSearchesCreateUrl = `${baseURL}/api/saved_searches`;
const savedSearchesDeleteUrl = `${baseURL}/api/saved_searches/delete`;
const savedSearchesUpdateUrl = `${baseURL}/api/saved_searches/update`;

export class Http {
  static config: AxiosRequestConfig = {
    headers: {
      Accept: 'application/json'
    }
  };

  private static instance: Http | null;
  private sessionId?: string;

  public static sessionGoneHandler: () => void | null;

  constructor(sessionId?: string) {
    this.sessionId = sessionId;
  }

  static login(sessionId: string | null): void {
    if (sessionId) {
      Http.instance = new Http(sessionId);
    } else {
      Http.logout();
    }
  }

  static logout(): void {
    Http.instance = null;
  }

  getConfig(): any {
    const result = { ...Http.config };
    result.headers = Object.assign(
      {},
      result.headers,
      this.sessionId ? { 'x-archivessearch-session': this.sessionId } : {}
    );

    return result;
  }

  static get(): any {
    if (!Http.instance) {
      Http.instance = new Http();
    }

    return Http.instance;
  }

  handleError(error: any, message?: string): any {
    let errorMessage = message;

    if (!errorMessage) {
      errorMessage = error.message;
    }

    if (error.isAxiosError && error.message === 'Network Error') {
      errorMessage = "Could not contact server"
    }

    (window as any).handleFatalError && (window as any).handleFatalError(errorMessage || '', error);

    return error;
  }

  responseProcessor(response: any) {
    if (Http.sessionGoneHandler && response.headers['x-archivessearch-session-gone']) {
      Http.sessionGoneHandler();
    }
  }

  async fireGet(url: any, ...axiosGetArgs: any[]): Promise<any> {
    const response = await axios.get(url, ...axiosGetArgs);

    this.responseProcessor(response);

    return response;
  }

  async firePost(url: any, ...axiosPostArgs: any[]): Promise<any> {
    const response = await axios.post(url, ...axiosPostArgs);

    this.responseProcessor(response);

    return response;
  }

  async fetchResults<T>(advancedSearchQuery: AdvancedSearchQuery, page = 0, sort = 'relevance'): Promise<T[]> {
    const query = advancedSearchQuery.toJSON();
    const response = await this.firePost(`${searchUrl}?query=${query}&page=${page}&sort=${sort}`, {}, this.getConfig()).catch(error => {
      return this.handleError(error, "Failed to fetch search results");
    });

    return response.data || [];
  }

  async fetchByQSAID(qsaId: string, recordType: string): Promise<any> {
    const response = await this.fireGet(`${fetchUrl}?qsa_id=${qsaId}&type=${recordType}`, this.getConfig())
      .catch(error => {
        return this.handleError(error, `Failure fetching record with ID ${qsaId}`);
      });

    return response.data;
  }

  async fetchContextByQSAID(qsaId: string, recordType: string): Promise<any> {
    const response = await this.fireGet(`${contextUrl}?qsa_id=${qsaId}&type=${recordType}`, this.getConfig())
      .catch(error => {
        return {data: false}
      });

    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('email', email);
    bodyFormData.set('password', password);

    const response = await this.firePost(loginUrl, bodyFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .catch(error => {
        return this.handleError(error, "Login failed");
      });

    return response.data || [];
  }

  async logout(): Promise<any> {
    const response = await this.firePost(logoutUrl, {}, this.getConfig()).catch(error => {
      return this.handleError(error, "Logout failed");
    });

    return response.data || [];
  }

  async getCurrentUser(): Promise<AxiosResponse> {
    return await this.fireGet(`${loggedInUserUrl}`, this.getConfig());
  }

  async register(user: UserForm): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('user', JSON.stringify(user));

    const response = await this.firePost(registerUrl, bodyFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .catch(error => {
        return this.handleError(error, "Failed to register new user");
      });

    return response.data || [];
  }

  async updateUser(user: UserForm): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('user', JSON.stringify(user));

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(updateContactDetailsUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to update user");
    });

    return response.data || [];
  }

  async updatePassword(data: any): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('current_password', data.current_password);
    bodyFormData.set('password', data.password);
    bodyFormData.set('confirm_password', data.confirm_password);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(updatePasswordUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to update password");
    });

    return response.data || [];
  }

  async getUsers(page: number, filter: any): Promise<any> {
    const params = Object.assign({}, { page: page }, filter, {
      version: undefined
    });

    const response = await this.fireGet(`${usersUrl}`, Object.assign({}, this.getConfig(), { params }))
      .catch(error => {
        return this.handleError(error, "Failed to list users");
      });

    return response.data || [];
  }

  async getUser(userId: number): Promise<any> {
    const params = { user_id: userId };
    const response = await this.fireGet(`${userUrl}`, Object.assign({}, this.getConfig(), { params }))
      .catch(error => {
        return this.handleError(error, "Failed to get user");
      });

    return response.data || [];
  }

  async generateRecoveryToken(email: string): Promise<PasswordRecoveryResponse> {
    const params = { email };
    const response = await this.fireGet(`${recoveryTokenUrl}`, Object.assign({}, this.getConfig(), { params }))
      .catch(error => {
        return this.handleError(error, "Failed to get recovery token URL");
      });
    return response.data;
  }

  async recoverPassword(token: string, password: string, confirmPassword: string): Promise<PasswordRecoveryResponse> {
    const params = {
      token: token,
      password: password,
      confirm_password: confirmPassword
    };

    const response = await this.fireGet(`${recoveryTokenPasswordUrl}`, Object.assign({}, this.getConfig(), { params }))
      .catch(error => {
        return this.handleError(error, "Failed to set recovered password");
      });

    return response.data;
  }

  async getCart(): Promise<any> {
    const response = await this.fireGet(`${cartUrl}`, this.getConfig())
      .catch(error => {
        return this.handleError(error, "Failed to fetch cart");
      });

    return response.data || [];
  }

  async addToCart(item_id: string, request_type: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('item_id', item_id);
    bodyFormData.set('request_type', request_type);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(addToCartUrl, bodyFormData, config)
      .catch(error => {
        return this.handleError(error, "Failed to add item to cart");
      });

    return response.data || [];
  }

  async updateCartItems(cartItems: any[], requestType: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('request_type', requestType);
    cartItems.forEach((cartItem: any) => {
      bodyFormData.append('cart_items[]', JSON.stringify(cartItem.options));
    });

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(updateCartItemsUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to update cart items");
    });

    return response.data || [];
  }

  async removeFromCart(cartItemId: number): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('id', String(cartItemId));

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(removeFromCartUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to remove item from cart");
    });

    return response.data || [];
  }

  async submitReadingRoomRequests(dateRequired?: string, timeRequired?: string, agencyFields?: any): Promise<any> {
    const bodyFormData = new FormData();
    if (dateRequired) {
      bodyFormData.set('date_required', dateRequired);
    }

    if (timeRequired) {
      bodyFormData.set('time_required', timeRequired);
    }

    if (agencyFields) {
      bodyFormData.set('agency_fields', JSON.stringify(agencyFields));
    }

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(submitReadingRoomRequestsUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to submit reading room request");
    });

    return response.data || [];
  }

  async getRequests(sortBy: string): Promise<any> {
    const params = {
      sort_by: sortBy
    };

    const response = await this.fireGet(`${userRequestsUrl}`, Object.assign({}, this.getConfig(), { params })).catch(error => {
      return this.handleError(error, "Failed to get user requests");
    });

    return response.data || [];
  }

  async getRequest(requestId: string): Promise<any> {
    const response = await this.fireGet(`${userGetRequestUrl}${requestId}`, this.getConfig()).catch(error => {
      return this.handleError(error, "Failed to get request");
    });

    return response.data || [];
  }

  async cancelRequest(requestId: string): Promise<any> {
    const config = this.getConfig();

    const bodyFormData = new FormData();
    bodyFormData.set('id', requestId);

    const response = await this.firePost(cancelRequestUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to cancel request");
    });

    return response.data || [];
  }


  async updateRequestDateRequired(requestId: string, dateRequired: string, timeRequired: string): Promise<any> {
    const config = this.getConfig();

    const bodyFormData = new FormData();
    bodyFormData.set('id', requestId);
    bodyFormData.set('date_required', dateRequired);
    bodyFormData.set('time_required', timeRequired);

    const response = await this.firePost(updateRequestDateRequiredUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to update request");
    });

    return response.data || [];
  }

  async clearCart(requestType: string): Promise<any> {
    const config = this.getConfig();

    const bodyFormData = new FormData();
    bodyFormData.set('request_type', requestType);

    const response = await this.firePost(clearCartUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to clear cart");
    });

    return response.data || [];
  }

  async submitDigitalQuoteRequest(): Promise<any> {
    const bodyFormData = new FormData();

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(submitDigitalQuoteUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to submit digital quote request");
    });

    return response.data || [];
  }

  async becomeUser(userId: number): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('user_id', ''+userId);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(becomeUserUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to become user");
    });

    return response.data || [];
  }

  async getDigitalCopyPricing(): Promise<any> {
    const response = await this.fireGet(`${digitalCopyPricingUrl}`, this.getConfig()).catch(error => {
      return this.handleError(error, "Failed to get digital copy pricing");
    });

    return response.data || {};
  }

  async goToPayment(options: any): Promise<any> {
    const bodyFormData = new FormData();

    Object.keys(options).forEach((key: string) => {
      bodyFormData.set(key, options[key]);
    });

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    return await this.firePost(submitOrderUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to submit order");
    });
  }

  async getTags(recordId: string): Promise<any> {
    const params = {
      record_id: recordId
    };

    const response = await this.fireGet(`${getTagsUrl}`, Object.assign({}, this.getConfig(), { params }))
      .catch(error => {
        return this.handleError(error, "Failed to get tags");
      });

    return response.data || [];
  }

  async addTag(tag: string, recordId: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('tag', JSON.stringify({
      tag: tag,
      record_id: recordId,
    }));

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(addTagUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to add tag");
    });

    return response.data || [];
  }

  async flagTag(tagId: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('tag_id', tagId);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(flagTagUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to flag tag");
    });

    return response.data || [];
  }

  async getAllFlaggedTags(): Promise<any> {
    const response = await this.fireGet(`${getFlaggedTagsUrl}`, this.getConfig()).catch(error => {
      return this.handleError(error, "Failed to list all flag tags");
    });

    return response.data || [];
  }

  async moderateTag(tagId: string, action: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.set('tag_id', tagId);
    bodyFormData.set('action', action);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(moderateTagUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to moderate tag");
    });

    return response.data || [];
  }

  async getBannedTags(): Promise<any> {
    const response = await this.fireGet(`${getBannedTagsUrl}`, this.getConfig())
      .catch(error => {
        return this.handleError(error, "Failed to get banned tags");
      });

    return response.data || [];
  }

  async addToBannedTags(tags: string[]): Promise<any> {
    const bodyFormData = new FormData();
    tags.forEach((tag) => {
      bodyFormData.append('tag[]', tag);
    });

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(addToBannedTagsUrl, bodyFormData, config)
      .catch(error => {
        return this.handleError(error, "Failed to add to banned tag");
      });

    return response.data || [];
  }

  async removeFromBannedTags(tags: string[]): Promise<any> {
    const bodyFormData = new FormData();
    tags.forEach((tag) => {
      bodyFormData.append('tag[]', tag);
    });

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(removeFromBannedTagsUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to remove banned tags");
    });

    return response.data || [];
  }

  async previewTag(tag: string): Promise<any> {
    const params = {
      tag: tag
    };

    const response = await this.fireGet(`${getPreviewTagUrl}`, Object.assign({}, this.getConfig(), {params}))
      .catch(error => {
        // Non-fatal!
        return {data: []};
      });

    return response.data || [];
  }

  async verifyCaptcha(token: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('captcha_token', token);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(verifyCaptchaUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to verify CAPTCHA");
    });

    return response.data || [];
  }

  async isCaptchaVerified(): Promise<any> {
    const response = await this.fireGet(`${isCaptchaVerifiedUrl}`, this.getConfig()).catch(error => {
      return this.handleError(error, "Failed to check CAPTCHA verification status");
    });

    return response.data || [];
  }

  async listPages(): Promise<any> {
    const response = await this.fireGet(`${listPagesUrl}`, this.getConfig()).catch(error => {
      return this.handleError(error, "Failed to list pages");
    });

    return response.data || [];
  }

  async getPageContent(slug: string, nonce: string): Promise<any> {
    let params: any = { slug };

    if (nonce) {
      params.nonce = nonce;
    }

    const response = await this.fireGet(`${getPageContentUrl}`,
                                     Object.assign({},
                                                   this.getConfig(),
                                                   { params }));
    return response.data || '';
  }

  async savePage(slug: string, content: string, newPage: boolean): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('slug', slug);
    bodyFormData.append('content', content);
    bodyFormData.append('newpage', newPage ? 'true' : 'false');

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    return await this.firePost(savePageUrl, bodyFormData, config)
  }

  async deletePage(slug: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('slug', slug);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(deletePageUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to delete page");
    });

    return response.data || [];
  }

  async restorePage(slug: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('slug', slug);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(restorePageUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to restore page");
    });

    return response.data || [];
  }

  async getSavedSearches(): Promise<any> {
    const response = await this.fireGet(`${savedSearchesAllUrl}`, this.getConfig())
        .catch(error => {
          return this.handleError(error, "Failed to get saved searches");
        });

    return response.data || [];
  }

  async createSavedSearch(query_string: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('query_string', query_string);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(savedSearchesCreateUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to created saved search");
    });

    return response.data || [];
  }

  async deleteSavedSearch(id: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('id', id);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(savedSearchesDeleteUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to delete saved search");
    });

    return response.data || [];
  }

  async updateSavedSearch(id: string, note: string): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('id', id);
    bodyFormData.append('note', note);

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(savedSearchesUpdateUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to update saved search");
    });

    return response.data || [];
  }

  async reorderOpenRequests(cartItemId: string, currentIndex: number, targetIndex: number): Promise<any> {
    const bodyFormData = new FormData();
    bodyFormData.append('cart_item_id', cartItemId);
    bodyFormData.append('current_index', currentIndex + '');
    bodyFormData.append('target_index', targetIndex + '');

    const config = this.getConfig();
    config.headers['Content-Type'] = 'multipart/form-data';

    const response = await this.firePost(reorderOpenRequestsUrl, bodyFormData, config).catch(error => {
      return this.handleError(error, "Failed to update order");
    });

    return response.data || [];
  }
}
