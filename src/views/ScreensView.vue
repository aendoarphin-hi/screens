<template>
  <div :id="`${$route.name}-view`" class="route-view__container">
    <!-- help modal -->
    <HelpModalComponent>
      <h5>Navigation</h5>
      <p>Use the tabs to navigate between <strong>Screens, Playlists, Content</strong>.</p>
      <h5>Screens</h5>
      <p>
        Each available screen can be edited with <span class="btn btn-sm btn-primary small mx-2"
          style="font-size: 10px;">Edit</span>
        and assigned a playlist containing a sequence of images (content) to be presented.
        Online or disabled devices can also be previewed (
        <OpenInNew />)
      </p>
      <h5>Screen Status</h5>
      <span :class="statusBadgeClass('online')" class="badge">Online</span><small> - Screen is fully operational and
        all actions can be applied.</small><br />
      <span :class="statusBadgeClass('offline')" class="badge">Offline</span><small> - Changes cannot be applied to
        screen because the device is currently down.</small><br />
      <span :class="statusBadgeClass('disabled')" class="badge">Disabled</span><small> - Screen is unavailable. No
        content will be shown and no actions can be applied.</small><br /><br />
      <h5>Playlists</h5>
      <p>
        Playlists can be edited (
        <Pencil />)
        and assigned to a screen. Playlists contain a set of ordered images (content) to be presented.
        Each playlist is created by a user with <span class="btn btn-sm btn-success small" style="font-size: 10px;">
          <PlaylistPlay /> New Playlist
        </span>
      </p>
      <h5>Content</h5>
      <p>
        Content can be edited (
        <Pencil />)
        and added to a playlist. Content uploads will undergo approval before they can be added to a
        playlist.
        Upload new content with <span class="btn btn-sm btn-primary small" style="font-size: 10px;">
          <UploadBox /> Upload Content
        </span>
      </p>
      <h5>Group Permissions</h5>
      <small>
        <strong>System</strong> - All actions allowed, with additional backend configuration options for screens
        <br />
        <strong>HR</strong> - Manage events, screens, playlists, content, and approvals<br />
        <strong>Supervisors</strong> - Upload content and create new playlists
      </small>
    </HelpModalComponent>

    <!--  header + toolbar  -->
    <div class="route-view__header">
      <!-- heading -->
      <div class="route-view__heading">
        <span>{{ $route.name }}</span>
        <span>
          <HelpCircleOutline data-bs-toggle="modal" data-bs-target="#help-modal" title="Help" class="cursor-pointer" />
        </span>
      </div>
      <!-- toolbar -->
      <div class="route-view__toolbar">
        <!-- add any toolbar buttons here if needed in the future -->
        <button class="btn btn-sm btn-success" @click="openNewPlaylistModal">
          <PlaylistPlay /> New Playlist
        </button>
        <button class="btn btn-sm btn-primary" @click="openUploadModal">
          <UploadBox /> Upload Content
        </button>
        <RouterLink to="configuration">
          <button v-if="inSystemGroup()" class="btn btn-sm btn-secondary">
            <Cog /> Configure Screens
          </button>
        </RouterLink>
      </div>
    </div>
    <!-- main content -->
    <div class="card p-3">
      <!-- tabs -->
      <ul class="nav nav-tabs" id="screens-tab-list">
        <li v-for="endpoint in endpoints" :key="endpoint" class="nav-item">
          <button class="nav-link text-capitalize" :class="activeTab === endpoint ? 'active' : ''"
            @click="activeTab = endpoint; search = ''" :id="`${endpoint}-tab`" type="button">
            {{ endpoint }}
          </button>
        </li>
      </ul>
      <!-- tab views -->
      <div class="tab-content">
        <template v-if="loading">
          <div class="">
            <LoadingComponent :message="`Loading ${activeTab}...`" />
          </div>
        </template>
        <template v-else>

          <!--===============================================================================================================
          TAB VIEW - SCREENS
          ===================================================================================================================-->

          <div class="tab-pane px-0 fade show" :class="activeTab === 'screens' ? 'show active' : ''" id="screens">
            <!-- filters, sort, view toggle row -->
            <div class="tab-pane__toolbar">
              <!-- Filters -->
              <div class="hstack gap-2 flex-wrap">
                <small>
                  <Filter class="me-1" />Filter By
                </small>
                <select class="form-select form-select-sm text-capitalize" v-model="filters.screens.location"
                  style="width: 160px">
                  <option value="" selected>All Locations</option>

                  <option v-for="l in locations" :key="l.id" :value="l.name">
                    {{ l.name }}
                  </option>
                </select>

                <select class="form-select form-select-sm text-capitalize" v-model="filters.screens.status"
                  style="width: 140px">
                  <option value="">All Statuses</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <!-- search bar 1 -->
              <input type="search" class="form-control form-control-sm col d-none d-xl-block" placeholder="Search"
                v-model="search" />
              <!-- sort dropdown -->
              <div class="ms-0 ms-lg-auto hstack gap-2">
                <small>
                  <Sort class="me-1" />Sort By
                </small>
                <select id="status-sort-screens" class="form-select form-select-sm text-capitalize"
                  :value="sortColumns.screens" @change="sortList($event.target.value)" style="width: 160px">

                  <option v-for="sc in sortableColumns.screens" :key="sc" :value="sc">{{ sc }} - Asc
                  </option>
                  <option v-for="sc in sortableColumns.screens" :key="sc" :value="sc">{{ sc }} - Desc
                  </option>
                </select>
              </div>
              <!-- view toggle for grid/list -->
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn" :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="List view" @click="viewMode = 'list'">
                  <ViewList />
                </button>
                <button type="button" class="btn" :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Grid view" @click="viewMode = 'grid'">
                  <ViewGrid />
                </button>
              </div>
              <!-- refresh button -->
              <button :disabled="loading" class="btn btn-outline-secondary btn-sm" title="Refresh"
                @click="refreshTabPane('screens')">
                <Refresh />
              </button>
              <!-- clear filter button -->
              <button @click="clearFilters" class="btn btn-outline-secondary btn-sm" title="Clear Filters">
                <FilterOffOutline />
              </button>
            </div>
            <!-- search bar 2 -->
            <input type="search" class="form-control form-control-sm mb-3 d-block d-xl-none" placeholder="Search"
              v-model="search" />
            <!-- list view -->
            <div v-if="viewMode === 'list'" class="table-responsive">
              <table v-if="screens.length > 0" class="table table-hover align-middle mb-0">
                <thead class="table-light sticky-top shadow-sm text-nowrap small">
                  <tr>
                    <th v-for="(sc, i) in sortableColumns.screens" class="cursor-pointer" v-bind:key="i"
                      @click="sortList(sc)">
                      {{ columnLabel(sc) }}
                      <template v-if="sc === sortColumns.screens">
                        <TriangleSmallUp v-if="!sortDesc.screens" />
                        <TriangleSmallDown v-else />
                      </template>
                    </th>
                    <th scope="col">Playlist</th>
                    <th class="text-end" scope="col">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, i) in screens" :key="s.id" @mouseover="hoverIndex = i" @mouseleave="hoverIndex = -1">
                    <td class="fw-semibold"
                      style="max-width: 500px; overflow: hidden; text-overflow: ellipsis; text-wrap: nowrap">
                      {{ s.title }}
                    </td>
                    <td>{{ s.location }}</td>
                    <td>
                      <span class="badge text-capitalize" :class="statusBadgeClass(s.status)">{{ s.status }}</span>
                    </td>
                    <td>
                      <span>{{ getPlaylistName(s.playlist_id) }}</span>
                    </td>
                    <td class="text-end">
                      <div class="d-flex gap-2 justify-content-end" :class="{ invisible: hoverIndex !== i }">
                        <button class="btn btn-sm btn-outline-secondary cursor-pointer" @click="openScreenPreview(s)">
                          <OpenInNew /> Preview
                        </button>
                        <button @click="openEditScreenModal(s)" class="btn btn-sm btn-outline-secondary cursor-pointer">
                          <Pencil /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="screens.length === 0" class="emtpy-state">
                <span class="text-muted">No screens found.</span>
              </div>
            </div>

            <!-- grid view -->
            <div v-else-if="viewMode === 'grid'"
              class="tab-pane__gridview"
              style="max-height: 70dvh">
              <div v-for="(s, i) in screens" :key="s.id" @mouseover="hoverIndex = i" @mouseleave="hoverIndex = -1"
                class="card border col-12 col-md-5 col-lg-3 col-xl-2">
                <div class="card-body d-flex flex-column gap-2">
                  <div class="fw-semibold" style="max-width: 500px; overflow: hidden; text-overflow: ellipsis">
                    <Television /> {{ s.title }}
                  </div>
                  <span>
                    <span class="badge text-capitalize" :class="statusBadgeClass(s.status)">{{ s.status }}</span>
                  </span>
                  <span v-if="s.playlist_id" class="text-muted">
                    <PlaylistPlay /> {{ getPlaylistName(s.playlist_id) }}
                  </span>
                  <span v-if="s.location" class="text-muted">
                    <MapMarker /> {{ s.location }}
                  </span>
                  <div class="d-flex flex-row gap-2" :class="{ 'opacity-0': hoverIndex !== i }">
                    <button style="font-size: 10px;" @click="openScreenPreview(s)"
                      class="w-50 text-nowrap cursor-pointer btn btn-sm btn-secondary">
                      Preview
                    </button><button style="font-size: 10px;" @click="openEditScreenModal(s)"
                      class="w-50 cursor-pointer mt-auto btn btn-sm btn-primary">Edit</button>
                  </div>
                </div>
              </div>
              <div v-if="screens.length === 0" class="empty-state">
                <span class="text-muted">No screens found.</span>
              </div>
            </div>
          </div>

          <!--===============================================================================================================
          TAB VIEW - PLAYLISTS
          ===================================================================================================================-->

          <div class="tab-pane px-0 fade" :class="activeTab === 'playlists' ? 'show active' : ''" id="playlists">
            <!-- sort, view toggle row -->
            <div class="tab-pane__toolbar">
              <!-- search bar 1 -->
              <input type="search" class="form-control form-control-sm col d-none d-xl-block" placeholder="Search"
                v-model="search" />
              <!-- sort dropdown -->
              <div class="ms-0 hstack gap-2">
                <small>
                  <Sort class="me-1" />Sort By
                </small>
                <select id="status-sort-playlists" class="form-select form-select-sm text-capitalize"
                  :value="sortColumns.playlists" @change="sortList($event.target.value)" style="width: 160px">

                  <option v-for="sc in sortableColumns.playlists" :key="sc" :value="sc">{{ sc }} - Asc
                  </option>
                  <option v-for="sc in sortableColumns.playlists" :key="sc" :value="sc">{{ sc }} - Desc
                  </option>
                </select>
              </div>
              <!-- view toggle for grid/list -->
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn" :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="List view" @click="viewMode = 'list'">
                  <ViewList />
                </button>
                <button type="button" class="btn" :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Grid view" @click="viewMode = 'grid'">
                  <ViewGrid />
                </button>
              </div>
              <!-- refresh button -->
              <button :disabled="loading" class="btn btn-outline-secondary btn-sm" title="Refresh"
                @click="() => refreshTabPane('playlists')">
                <Refresh />
              </button>
              <!-- clear filter button -->
              <button @click="clearFilters" class="btn btn-outline-secondary btn-sm" title="Clear Filters">
                <FilterOffOutline />
              </button>
            </div>
            <!-- search bar 2 -->
            <input type="search" class="form-control form-control-sm mb-3 d-block d-xl-none" placeholder="Search"
              v-model="search" />
            <!-- list view -->
            <div v-if="viewMode === 'list'" class="table-responsive">
              <table v-if="playlists.length > 0" class="table table-hover align-middle mb-0">
                <thead class="table-light sticky-top shadow-sm text-nowrap small">
                  <tr>
                    <th v-for="(sc, i) in sortableColumns.playlists" class="cursor-pointer" v-bind:key="i"
                      @click="sortList(sc)">
                      {{ columnLabel(sc) }}
                      <template v-if="sc === sortColumns.playlists">
                        <TriangleSmallUp v-if="!sortDesc.playlists" />
                        <TriangleSmallDown v-else />
                      </template>
                    </th>
                    <th class="text-end" scope="col">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in playlists" :key="p.id" @mouseover="hoverIndex = i" @mouseleave="hoverIndex = -1">
                    <td class="fw-semibold"
                      style="max-width: 500px; overflow: hidden; text-overflow: ellipsis; text-wrap: nowrap">
                      {{ p.name }}
                    </td>
                    <td>{{ p.description }}</td>
                    <td class="text-end">
                      <div class="d-flex gap-3 justify-content-end" :class="{ invisible: hoverIndex !== i }">
                        <button @click="openEditPlaylistModal(p)"
                          class="btn btn-sm btn-outline-secondary cursor-pointer">
                          <Pencil /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="playlists.length === 0" class="empty-state">
                <span class="text-muted">No playlists found.</span>
              </div>
            </div>

            <!-- grid view -->
            <div v-else-if="viewMode === 'grid'"
              class="tab-pane__gridview"
              style="max-height: 70dvh">
              <div v-for="(p, i) in playlists" :key="p.id" @mouseover="hoverIndex = i" @mouseleave="hoverIndex = -1"
                class="card border col-12 col-md-5 col-lg-3 col-xl-2">
                <div class="card-body d-flex flex-column gap-2">
                  <span class="fw-semibold" style="max-width: 500px; overflow: hidden; text-overflow: ellipsis">
                    <PlaylistPlay /> {{ p.name }}
                  </span>
                  <span v-if="p.created_by" class="small">
                    <Account />{{ empName(p.created_by) }}
                  </span>
                  <span class="text-muted">
                    {{ p.description }}
                  </span>
                  <span @click="openEditPlaylistModal(p)" class="cursor-pointer mt-auto btn btn-sm btn-primary"
                    :class="{ 'opacity-0': hoverIndex !== i }" style="font-size: 10px;">Edit</span>
                </div>
              </div>
              <div v-if="playlists.length === 0" class="empty-state">
                <span class="text-muted">No playlists found.</span>
              </div>
            </div>
          </div>
          
          <!--===============================================================================================================
          TAB VIEW - CONTENT
          ===================================================================================================================-->

          <div class="tab-pane px-0 fade" :class="activeTab === 'content' ? 'show active' : ''" id="content">
            <div class="tab-pane__toolbar">
              <!-- Filters -->
              <div class="hstack gap-2 flex-wrap">
                <small>
                  <Filter class="me-1" />Filter By
                </small>
                <select class="form-select form-select-sm text-capitalize" v-model="filters.content.type"
                  style="width: 160px">
                  <option value="" selected>All Types</option>
                  <option v-for="type in uniqueContentTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
                <select class="form-select form-select-sm" v-model="filters.content.status" style="width: 160px">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <!-- search bar 1 -->
              <input type="search" class="form-control form-control-sm col d-none d-xl-block" placeholder="Search"
                v-model="search" />
              <!-- sort dropdown -->
              <div class="ms-0 ms-lg-auto hstack gap-2">
                <small>
                  <Sort class="me-1" />Sort By
                </small>
                <select id="status-sort-content" class="form-select form-select-sm text-capitalize"
                  :value="sortColumns.content" @change="sortList($event.target.value)" style="width: 180px">

                  <option v-for="sc in sortableColumns.content" :key="sc" :value="sc">{{
                    sc.includes('_')
                      ? sc.split('_').join(' ') : sc }} - Asc
                  </option>
                  <option v-for="sc in sortableColumns.content" :key="sc" :value="sc">{{
                    sc.includes('_')
                      ? sc.split('_').join(' ') : sc }} - Desc
                  </option>
                </select>
              </div>
              <!-- view toggle for grid/list -->
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn" :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="List view" @click="viewMode = 'list'">
                  <ViewList />
                </button>
                <button type="button" class="btn" :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Grid view" @click="viewMode = 'grid'">
                  <ViewGrid />
                </button>
              </div>
              <!-- refresh button -->
              <button :disabled="loading" class="btn btn-outline-secondary btn-sm" title="Refresh"
                @click="refreshTabPane('content')">
                <Refresh />
              </button>
              <button @click="clearFilters" class="btn btn-outline-secondary btn-sm" title="Clear Filters">
                <FilterOffOutline />
              </button>
            </div>
            <!-- search bar 2 -->
            <input type="search" class="form-control form-control-sm mb-3 d-block d-xl-none" placeholder="Search"
              v-model="search" />

            <!-- list view -->
            <div v-if="viewMode === 'list'" class="table-responsive">
              <table v-if="content.length > 0" class="table table-hover align-middle mb-0">
                <thead class="table-light sticky-top shadow-sm text-nowrap">
                  <tr>
                    <th v-for="(sc, i) in sortableColumns.content" class="cursor-pointer" v-bind:key="i"
                      @click="sortList(sc)">
                      {{ columnLabel(sc) }}
                      <template v-if="sc === sortColumns.content">
                        <TriangleSmallUp v-if="!sortDesc.content" />
                        <TriangleSmallDown v-else />
                      </template>
                    </th>
                    <th class="text-end" scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(c, i) in content" :key="c.id" @mouseover="hoverIndex = i" @mouseleave="hoverIndex = -1">
                    <td>
                      <span class="badge" :class="contentTypeBadgeClass(c.type)">{{ c.type }}</span>
                    </td>
                    <td class="fw-semibold"
                      style="max-width: 500px; overflow: hidden; text-overflow: ellipsis; text-wrap: nowrap">
                      {{ c.title }}
                    </td>
                    <td>
                      <span class="badge text-capitalize my-0" :class="contentStatusBadgeClass(c.status)">{{ c.status
                      }}</span>
                    </td>
                    <td>
                      <span class="text-muted text-capitalize">{{ new Date(c.created_at).toLocaleString() }}</span>
                    </td>
                    <td>
                      <span class="text-muted">{{ empName(c.uploaded_by) }}</span>
                    </td>
                    <td class="text-end">
                      <div class="text-nowrap d-flex gap-3 justify-content-end"
                        :class="{ invisible: hoverIndex !== i }">
                        <button class="btn btn-sm btn-outline-secondary cursor-pointer"
                          @click="openEditContentModal(c)">
                          <Pencil /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="content.length === 0" class="empty-state">
                <span class="text-muted">No content found.</span>
              </div>
            </div>

            <!-- grid view -->
            <div v-else-if="viewMode === 'grid'"
              class="tab-pane__gridview"
              style="max-height: 70dvh">
              <div v-for="(c, i) in content" :key="c.id" @mouseover="hoverIndex = i" @mouseleave="hoverIndex = -1"
                class="card border col-12 col-md-5 col-lg-3 col-xl-2">
                <!-- image thumbnail -->
                <span v-if="c.thumb_url"
                  class="animate__animated animate__fadeIn position-relative d-flex justify-content-center align-items-center"
                  style="height: 100px;">
                  <img :src="c.thumb_url" class="card-img-top" alt="Thumbnail"
                    style="height: 100px; width: 100%; object-fit: cover;"
                    :style="{ filter: hoverIndex === i ? 'brightness(0.5)' : '' }" />

                  <!-- hover overlay -->
                  <span v-if="hoverIndex === i"
                    class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style="background-color: rgba(0, 0, 0, 0.2);">
                    <Pencil class="text-white cursor-pointer fs-3" @click="openEditContentModal(c)" />
                  </span>
                </span>

                <!-- file type thumbnail -->
                <span v-else :class="getContentThumbnail(c).class"
                  class="position-relative d-flex justify-content-center align-items-center" style="height: 100px;">
                  <component :is="getContentThumbnail(c).icon"
                    style="filter: drop-shadow(0 5px 3px rgba(0,0,0,0.5));" />

                  <!-- hover overlay -->
                  <span v-if="hoverIndex === i"
                    class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style="background-color: rgba(0,0,0,0.5);">
                    <Pencil class="text-white cursor-pointer fs-3" @click="openEditContentModal(c)" />
                  </span>
                </span>

                <div class="card-body d-flex flex-column gap-2">
                  <div class="fw-semibold" style="max-width: 500px; overflow: hidden; text-overflow: ellipsis">
                    {{ c.title }}
                  </div>

                  <small>
                    <span class="badge text-capitalize" :class="contentStatusBadgeClass(c.status)">
                      {{ c.status }}
                    </span>
                  </small>
                </div>
              </div>
              <div v-if="content.length === 0" class="empty-state">
                <span class="text-muted">No content found.</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <UploadContentModalComponent @uploaded="fetchEndpoint()" />
    <!-- update all to refresh existing content list in their modal -->
    <EditScreenModalComponent :employees="employees" @updated="refreshTabPane('screens')"
      @deleted="refreshTabPane('screens')" :screen="screenToEdit" />
    <AddPlaylistModalComponent :employees="employees" @created="refreshTabPane('playlists')" />
    <EditPlaylistModalComponent :employees="employees" @updated="refreshTabPane('playlists')"
      @deleted="refreshTabPane('playlists')" :playlist="playlistToEdit" />
    <EditContentModalComponent :employees="employees" :content="contentToEdit" @updated="refreshTabPane('content')"
      @deleted="refreshTabPane('content')" />
  </div>
</template>

<script>
import Filter from "vue-material-design-icons/Filter.vue";
import Sort from "vue-material-design-icons/Sort.vue";
import Pencil from "vue-material-design-icons/Pencil.vue";
import Restart from "vue-material-design-icons/Restart.vue";
import Refresh from "vue-material-design-icons/Refresh.vue";
import TriangleSmallUp from "vue-material-design-icons/TriangleSmallUp.vue";
import TriangleSmallDown from "vue-material-design-icons/TriangleSmallDown.vue";
import ViewGrid from "vue-material-design-icons/ViewGrid.vue";
import ViewList from "vue-material-design-icons/ViewList.vue";
import HelpCircleOutline from "vue-material-design-icons/HelpCircleOutline.vue";
import PlaylistPlay from "vue-material-design-icons/PlaylistPlay.vue";
import MapMarker from "vue-material-design-icons/MapMarker.vue";
import OpenInNew from "vue-material-design-icons/OpenInNew.vue";
import Image from "vue-material-design-icons/Image.vue";
import FilePdfBox from "vue-material-design-icons/FilePdfBox.vue";
import Video from "vue-material-design-icons/Video.vue";
import FileDocument from "vue-material-design-icons/FileDocument.vue";
import UploadBox from "vue-material-design-icons/UploadBox.vue";
import Television from "vue-material-design-icons/Television.vue";
import FilterOffOutline from "vue-material-design-icons/FilterOffOutline.vue";
import Cog from "vue-material-design-icons/Cog.vue";
import Account from "vue-material-design-icons/Account.vue";

import { filterByField, inSystemGroup, searchByText, sortByField } from "@/common/helpers";
import UploadContentModalComponent from "@/components/modals/UploadContentModalComponent.vue";
import EditContentModalComponent from "@/components/modals/EditContentModalComponent.vue";
import { nextTick } from "vue";
import EditScreenModalComponent from "@/components/modals/EditScreenModalComponent.vue";
import AddPlaylistModalComponent from "@/components/modals/AddPlaylistModalComponent.vue";
import EditPlaylistModalComponent from "@/components/modals/EditPlaylistModalComponent.vue";

export default {
  name: "ScreenView",
  components: {
    Filter,
    Sort,
    Pencil,
    Restart,
    Refresh,
    TriangleSmallUp,
    TriangleSmallDown,
    ViewGrid,
    ViewList,
    HelpCircleOutline,
    PlaylistPlay,
    MapMarker,
    OpenInNew,
    Image,
    FilePdfBox,
    Video,
    FileDocument,
    UploadBox,
    Television,
    FilterOffOutline,
    Cog,
    Account,

    UploadContentModalComponent,
    EditScreenModalComponent,
    AddPlaylistModalComponent,
    EditPlaylistModalComponent,
    EditContentModalComponent
  },
  inject: ["store"],
  data() {
    return {
      loading: true, // loading state
      endpoints: ["screens", "playlists", "content"],
      rawScreens: [],
      rawPlaylists: [],
      rawContent: [],
      employees: [],
      locations: [],
      dataReady: false,
      search: "",
      filters: {
        screens: {
          location: "",
          status: "",
        },
        content: {
          type: "",
          status: "",
        },
      },
      sortColumns: {
        screens: "name",
        playlists: "name",
        content: "title",
      },
      sortableColumns: {
        screens: ["name", "location", "status"],
        playlists: ["name", "description"],
        content: ["type", "title", "status", "created_at", "uploaded_by"],
      },
      sortDesc: {
        screens: false,
        playlists: false,
        content: false,
      },
      hoverIndex: -1, // for hover effect on tab actions
      viewMode: "grid", // grid or list
      activeTab: "screens", // active tab
      screenToEdit: null, // obj to pass to modal for editing
      playlistToEdit: null, // obj to pass to modal for editing
      contentToEdit: null, // obj to pass to modal for editing
    };
  },
  computed: {
    uniqueContentTypes() {
      // distinct options for content type filter
      return [...new Set([...this.rawContent].map((c) => c.type))].sort();
    },

    screens() {
      const locationNameById = Object.fromEntries(
        this.locations.map((l) => [l.id, l.name])
      );
      let result = this.rawScreens.map((s) => ({
        ...s,
        location: locationNameById[s.location_id] ?? "",
      }));
      result = filterByField(result, "location", this.filters.screens.location);
      result = filterByField(result, "status", this.filters.screens.status);
      if (this.search.trim().length > 0) {
        result = searchByText(result, this.search);
      }
      return sortByField(result, this.sortColumns.screens, this.sortDesc.screens);
    },

    playlists() {
      let result = [...this.rawPlaylists];
      if (this.search.trim().length > 0) {
        result = searchByText(result, this.search);
      }
      return sortByField(result, this.sortColumns.playlists, this.sortDesc.playlists);
    },

    content() {
      let result = [...this.rawContent];
      result = filterByField(result, "type", this.filters.content.type);
      result = filterByField(result, "status", this.filters.content.status);
      if (this.search.trim().length > 0) {
        result = searchByText(result, this.search);
      }
      return sortByField(result, this.sortColumns.content, this.sortDesc.content);
    },
  },
  methods: {
    openScreenPreview(s) {
      const route = this.$router.resolve({
        name: "Slideshow",
        query: {
          screenid: s.id,
        },
      });

      window.open(route.href, "_blank");
    },
    empName(number) {
      return this.employees.find((e) => e.number === number)?.name;
    },
    openEditScreenModal(s) {
      // window.alert(JSON.stringify(s, null, 2));
      this.screenToEdit = { ...s };
      nextTick(() => {
        this.$modal.show("edit-screen-modal");
      })
    },
    openEditPlaylistModal(p) {
      this.playlistToEdit = { ...p };
      nextTick(() => {
        this.$modal.show("edit-playlist-modal");
      })
    },
    openNewPlaylistModal() {
      nextTick(() => {
        this.$modal.show("add-playlist-modal");
        this.activeTab = "playlists";
      })
    },
    openUploadModal() {
      nextTick(() => {
        this.$modal.show("upload-content-modal");
        this.activeTab = "content";
      })
    },
    openEditContentModal(c) {
      this.contentToEdit = { ...c };
      nextTick(() => {
        this.$modal.show("edit-content-modal");
        this.activeTab = "content";
      })
    },
    inSystemGroup,
    clearFilters() {
      this.filters = {
        screens: {
          location: "",
          status: "",
        },
        content: {
          type: "",
          status: "",
        },
      };
      this.search = "";
      this.sortColumns = {
        screens: "name",
        playlists: "name",
        content: "title",
      };
      this.sortDesc = {
        screens: false,
        playlists: false,
        content: false,
      };
    },
    getContentThumbnail(c) {
      switch (c.type) {
        case "image":
          return { class: "bg-success text-white", icon: Image };
        case "video":
          return { class: "bg-primary text-white", icon: Video };
        case "pdf":
          return { class: "bg-danger text-white", icon: FilePdfBox };
        default:
          return { class: "bg-body-secondary text-muted", icon: FileDocument };
      }
    },
    getPlaylistName(pid) {
      const p = this.rawPlaylists.find((p) => p.id === pid);
      return p ? p.name : "";
    },
    sortList(column) {
      const tab = this.activeTab;
      if (this.sortColumns[tab] === column) {
        this.sortDesc[tab] = !this.sortDesc[tab];
      } else {
        this.sortColumns[tab] = column;
        this.sortDesc[tab] = false;
      }
    },

    columnLabel(l) {
      // remove underscore and capitalize
      return l.replace(/_/g, " ");
    },
    async fetchEndpoint(endpoint = null) {
      // fetch all three if no endpoint specified
      if (!endpoint) {
        this.rawScreens = (await this.$axios.get(this.$api + "?screens")).data;
        this.rawPlaylists = (await this.$axios.get(this.$api + "?playlists")).data;
        this.rawContent = (await this.$axios.get(this.$api + "?content")).data;
        return;
      }
      const res = await this.$axios.get(this.$api + "?" + endpoint);
      switch (endpoint) {
        case "screens":
          this.rawScreens = res.data;
          break;
        case "playlists":
          this.rawPlaylists = res.data;
          break;
        case "content":
          this.rawContent = res.data;
          break;
      }
    },
    async refreshTabPane(endpoint) {
      this.loading = true;

      try {
        await this.fetchEndpoint(endpoint);
      } catch (error) {
        console.error(`Failed to refresh ${endpoint}:`, error);
      } finally {
        this.loading = false;
      }
    },
    statusBadgeClass(status) {
      const map = {
        online: "bg-success-subtle text-success-emphasis",
        offline: "bg-danger-subtle text-danger-emphasis",
        disabled: "bg-secondary-subtle text-secondary-emphasis",
      };
      return map[status?.toLowerCase()] || "bg-secondary";
    },
    contentTypeBadgeClass(type) {
      const map = {
        image: "bg-success-subtle text-success-emphasis text-capitalize",
        video: "bg-primary-subtle text-primary-emphasis text-capitalize",
        other: "bg-body-secondary text-muted text-capitalize",
        pdf: "bg-warning-subtle text-warning-emphasis text-capitalize",
      };
      return map[type?.toLowerCase()] || "bg-secondary";
    },
    contentStatusBadgeClass(status) {
      const map = {
        active: "bg-success-subtle text-success-emphasis",
        inactive: "bg-danger-subtle text-danger-emphasis",
        archived: "bg-secondary-subtle text-secondary-emphasis",
      };
      return map[status?.toLowerCase()] || "bg-secondary";
    },
  },
  async mounted() {
    try {
      this.loading = true;

      // set active tab from query param if valid
      const tab = this.$route.query.tab;
      if (this.endpoints.includes(tab)) {
        this.activeTab = tab;
      }

      // get all employees
      this.employees = (await this.$axios.get(this.$api + "?employees")).data;
      // get all locations
      this.locations = (await this.$axios.get(this.$api + "?locations")).data;

      await Promise.all(this.endpoints.map((endpoint) => this.fetchEndpoint(endpoint)));

      this.loading = false;
    } catch (error) {
      console.log(error + " at " + this.name);
    }
  },
  watch: {
    "$route.query.tab"(tab) {
      if (this.endpoints.includes(tab)) {
        this.activeTab = tab;
      }
    },
    "search"() {
      // console.log(this.search)
    },
    "activeTab"() {
      this.clearFilters();
    },
  },
};
</script>

<style scoped>
.nav-item.active {
  background-color: var(--bs-primary);
}

.tab-pane {
  padding: 1rem;
}

.tab-pane__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-pane__gridview {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: start;
  overflow: hidden;
  overflow-y: auto;
  border-bottom: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color);
  border-top: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color);
  padding: 1rem 0;
}

.tab-pane__gridview div.card {
  font-size: clamp(0.8rem, 0.8vw, 1rem);
}

.table-responsive {
  max-height: 70dvh;
  overflow-y: auto;
  border-top: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color)
}

.table-responsive .emtpy-state {
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 3rem 0;
}

.table thead tr, .table tbody tr {
  vertical-align: middle;
}

.table thead tr th {
  text-transform: uppercase;
  font-size: 0.8rem;
}

.table tbody tr {
  font-size: 0.8rem;
}

.table tbody tr .btn-sm {
  font-size: 0.7rem;
}

.table tbody tr:nth-child(even) {
  background-color: var(--bs-primary);
}

.table tbody tr:first-of-type {
  border-top: none;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr td {
  padding: 0.25rem 0.5rem;
}

</style>
